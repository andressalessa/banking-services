import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';
import { ExpenseStatus } from '../enums/expense-status';

export interface ExpenseCancelledProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  amount: MonetarySnapshot;
  previousStatus: ExpenseStatus;
}

export class ExpenseCancelled implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly amount: MonetarySnapshot;
  public readonly previousStatus: ExpenseStatus;

  constructor(props: ExpenseCancelledProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.amount = props.amount;
    this.previousStatus = props.previousStatus;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
