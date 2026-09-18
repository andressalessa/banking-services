import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';

export interface ExpenseRefundedProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  amount: MonetarySnapshot;
  refundedAt: Date;
}

export class ExpenseRefunded implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly amount: MonetarySnapshot;
  public readonly refundedAt: Date;

  constructor(props: ExpenseRefundedProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.amount = props.amount;
    this.refundedAt = props.refundedAt;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
