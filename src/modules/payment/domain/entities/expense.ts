import { Money } from '@/core/value-objects/money';
import { PaymentDetails } from '../value-objects/payment-details';
import { Approval } from '../value-objects/approval';
import { Payee } from '../value-objects/payee';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { ExpenseIsNotApprovedError } from '../errors/expense-is-not-approved';
import { ExpenseStatus } from '../enums/expense-status';
import { ApprovalStatus, DecisionStatus } from '../enums/approval-status';

export interface ExpenseProps {
  accountId: UniqueEntityID;
  payee: Payee;
  amount: Money;
  paymentDetails: PaymentDetails;
  approval: Approval;
  status: ExpenseStatus;
  dueDate: Date;
  paidAt?: Date | null;
  createdAt: Date;
}

export class Expense extends AggregateRoot<ExpenseProps> {
  static create(
    props: Optional<
      ExpenseProps,
      'status' | 'approval' | 'createdAt' | 'paidAt'
    >,
    id?: UniqueEntityID,
  ): Expense {
    return new Expense(
      {
        ...props,
        approval: props.approval ?? Approval.create(),
        status: props.status ?? ExpenseStatus.DRAFT,
        createdAt: props.createdAt ?? new Date(),
        paidAt: props.paidAt ?? null,
      },
      id,
    );
  }

  get accountId(): UniqueEntityID {
    return this.props.accountId;
  }

  get payee(): Payee {
    return this.props.payee;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get paymentDetails(): PaymentDetails {
    return this.props.paymentDetails;
  }

  get approval(): Approval {
    return this.props.approval;
  }

  get status(): ExpenseStatus {
    return this.props.status;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get paidAt(): Date | null {
    return this.props.paidAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public approve(approverPersonId: string): void {
    this.props.approval = this.props.approval.addDecision({
      approverPersonId,
      status: DecisionStatus.APPROVED,
      createdAt: new Date(),
    });
  }

  public reject(approverPersonId: string, reason: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required.');
    }

    this.props.approval = this.props.approval.addDecision({
      approverPersonId,
      status: DecisionStatus.REJECTED,
      rejectionReason: reason,
      createdAt: new Date(),
    });
  }

  public markAsPaid(): void {
    if (this.props.approval.status !== ApprovalStatus.APPROVED) {
      throw new ExpenseIsNotApprovedError();
    }

    if (this.props.status === ExpenseStatus.CANCELLED) {
      throw new Error('Cannot pay a cancelled expense.');
    }

    this.props.status = ExpenseStatus.PAID;
    this.props.paidAt = new Date() ?? null;
  }

  public cancel(): void {
    if (this.props.status === ExpenseStatus.PAID) {
      throw new Error('Cannot cancel an already paid expense.');
    }

    this.props.status = ExpenseStatus.CANCELLED;
  }

  public schedule(): void {
    if (this.props.status !== ExpenseStatus.DRAFT) {
      throw new Error('Cannot schedule a non-draft expense.');
    }

    this.props.status = ExpenseStatus.SCHEDULED;
  }

  public refund(): void {
    if (this.props.status !== ExpenseStatus.PAID) {
      throw new Error('Cannot refund a non-paid expense.');
    }

    this.props.status = ExpenseStatus.REFUNDED;
  }

  public fail(): void {
    if (this.props.status !== ExpenseStatus.SCHEDULED) {
      throw new Error('Cannot fail a non-scheduled expense.');
    }

    this.props.status = ExpenseStatus.FAILED;
  }

  public process(): void {
    if (this.props.status !== ExpenseStatus.SCHEDULED) {
      throw new Error('Cannot process a non-scheduled expense.');
    }

    this.props.status = ExpenseStatus.PROCESSING;
  }
}
