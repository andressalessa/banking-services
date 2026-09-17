import { Money } from '@/core/value-objects/money';
import { PaymentDetails } from '../value-objects/payment-details';
import { Approval } from '../value-objects/approval';
import { Payee } from '../value-objects/payee';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { ExpenseIsNotApprovedError } from '../errors/expense-is-not-approved';

export type ExpenseStatus = 'DRAFT' | 'PAID' | 'CANCELLED';

export interface ExpenseProps {
  accountId: string;
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
        status: props.status ?? 'DRAFT',
        createdAt: props.createdAt ?? new Date(),
        paidAt: props.paidAt ?? null,
      },
      id,
    );
  }

  get accountId(): string {
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

  // RN: Registrar aprovação na alçada
  public approve(approverPersonId: string): void {
    this.props.approval = this.props.approval.addDecision({
      approverPersonId,
      status: 'APPROVED',
      createdAt: new Date(),
    });
  }

  // RN: Registrar rejeição na alçada
  public reject(approverPersonId: string, reason: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required.');
    }

    this.props.approval = this.props.approval.addDecision({
      approverPersonId,
      status: 'REJECTED',
      rejectionReason: reason,
      createdAt: new Date(),
    });
  }

  // RN: Marcar despesa como paga
  public markAsPaid(): void {
    if (this.props.approval.status !== 'APPROVED') {
      throw new ExpenseIsNotApprovedError();
    }

    if (this.props.status === 'CANCELLED') {
      throw new Error('Cannot pay a cancelled expense.');
    }

    this.props.status = 'PAID';
    this.props.paidAt = new Date() ?? null;
  }

  // RN: Cancelamento da despesa
  public cancel(): void {
    if (this.props.status === 'PAID') {
      throw new Error('Cannot cancel an already paid expense.');
    }

    this.props.status = 'CANCELLED';
  }
}
