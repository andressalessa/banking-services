import { Money } from '@/core/value-objects/money';
import { toMonetarySnapshot } from '@/core/events/monetary-snapshot';
import { PaymentDetails } from '../value-objects/payment-details';
import { Approval } from '../value-objects/approval';
import { Payee } from '../value-objects/payee';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { ExpenseIsNotApprovedError } from '../errors/expense-is-not-approved';
import { ExpenseStatus } from '../enums/expense-status';
import { ApprovalStatus, DecisionStatus } from '../enums/approval-status';
import { ExpenseCreated } from '../events/expense-created.event';
import { ExpenseApproved } from '../events/expense-approved.event';
import { ExpenseRejected } from '../events/expense-rejected.event';
import { ExpenseScheduled } from '../events/expense-scheduled.event';
import { ExpensePaid } from '../events/expense-paid.event';
import { ExpenseCancelled } from '../events/expense-cancelled.event';
import { ExpenseRefunded } from '../events/expense-refunded.event';
import { ExpenseFailed } from '../events/expense-failed.event';
import { ExpenseProcessing } from '../events/expense-processing.event';

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
    const expense = new Expense(
      {
        ...props,
        approval: props.approval ?? Approval.create(),
        status: props.status ?? ExpenseStatus.DRAFT,
        createdAt: props.createdAt ?? new Date(),
        paidAt: props.paidAt ?? null,
      },
      id,
    );

    expense.addDomainEvent(
      new ExpenseCreated({
        aggregateId: expense.id,
        expenseId: expense.id.toString(),
        accountId: expense.accountId.toString(),
        payee: {
          name: expense.payee.name,
          taxId: expense.payee.taxId,
          taxIdType: expense.payee.taxIdType,
        },
        amount: toMonetarySnapshot(expense.amount),
        paymentMethod: expense.paymentDetails.method,
        requiredApprovalsCount: expense.approval.requiredApprovalsCount,
        status: expense.status,
        dueDate: expense.dueDate,
      }),
    );

    return expense;
  }

  static restore(props: ExpenseProps, id: UniqueEntityID): Expense {
    return new Expense(props, id);
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
    const previousWorkflowStatus = this.props.approval.status;

    this.props.approval = this.props.approval.addDecision({
      approverPersonId,
      status: DecisionStatus.APPROVED,
      createdAt: new Date(),
    });

    if (
      previousWorkflowStatus !== ApprovalStatus.APPROVED &&
      this.props.approval.status === ApprovalStatus.APPROVED
    ) {
      this.addDomainEvent(
        new ExpenseApproved({
          aggregateId: this.id,
          expenseId: this.id.toString(),
          accountId: this.accountId.toString(),
          approverPersonId,
          approvalCount: this.props.approval.decisions.filter(
            (decision) => decision.status === DecisionStatus.APPROVED,
          ).length,
          requiredApprovalsCount: this.props.approval.requiredApprovalsCount,
          workflowStatus: this.props.approval.status,
          amount: toMonetarySnapshot(this.amount),
        }),
      );
    }
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

    this.addDomainEvent(
      new ExpenseRejected({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        rejectorPersonId: approverPersonId,
        rejectionReason: reason,
      }),
    );
  }

  public markAsPaid(): void {
    if (this.props.approval.status !== ApprovalStatus.APPROVED) {
      throw new ExpenseIsNotApprovedError();
    }

    if (this.props.status === ExpenseStatus.CANCELLED) {
      throw new Error('Cannot pay a cancelled expense.');
    }

    const paidAt = new Date();
    this.props.status = ExpenseStatus.PAID;
    this.props.paidAt = paidAt;

    this.addDomainEvent(
      new ExpensePaid({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        amount: toMonetarySnapshot(this.amount),
        payee: {
          name: this.payee.name,
          taxId: this.payee.taxId,
        },
        paymentMethod: this.paymentDetails.method,
        paidAt,
      }),
    );
  }

  public cancel(): void {
    if (this.props.status === ExpenseStatus.PAID) {
      throw new Error('Cannot cancel an already paid expense.');
    }

    const previousStatus = this.props.status;
    this.props.status = ExpenseStatus.CANCELLED;

    this.addDomainEvent(
      new ExpenseCancelled({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        amount: toMonetarySnapshot(this.amount),
        previousStatus,
      }),
    );
  }

  public schedule(): void {
    if (this.props.status !== ExpenseStatus.DRAFT) {
      throw new Error('Cannot schedule a non-draft expense.');
    }

    this.props.status = ExpenseStatus.SCHEDULED;

    this.addDomainEvent(
      new ExpenseScheduled({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        amount: toMonetarySnapshot(this.amount),
        paymentMethod: this.paymentDetails.method,
        dueDate: this.dueDate,
      }),
    );
  }

  public refund(): void {
    if (this.props.status !== ExpenseStatus.PAID) {
      throw new Error('Cannot refund a non-paid expense.');
    }

    this.props.status = ExpenseStatus.REFUNDED;
    const refundedAt = new Date();

    this.addDomainEvent(
      new ExpenseRefunded({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        amount: toMonetarySnapshot(this.amount),
        refundedAt,
      }),
    );
  }

  public fail(failureReason?: string): void {
    if (this.props.status !== ExpenseStatus.SCHEDULED) {
      throw new Error('Cannot fail a non-scheduled expense.');
    }

    this.props.status = ExpenseStatus.FAILED;

    this.addDomainEvent(
      new ExpenseFailed({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        amount: toMonetarySnapshot(this.amount),
        failureReason,
      }),
    );
  }

  public process(): void {
    if (this.props.status !== ExpenseStatus.SCHEDULED) {
      throw new Error('Cannot process a non-scheduled expense.');
    }

    this.props.status = ExpenseStatus.PROCESSING;

    this.addDomainEvent(
      new ExpenseProcessing({
        aggregateId: this.id,
        expenseId: this.id.toString(),
        accountId: this.accountId.toString(),
        amount: toMonetarySnapshot(this.amount),
        paymentMethod: this.paymentDetails.method,
      }),
    );
  }
}
