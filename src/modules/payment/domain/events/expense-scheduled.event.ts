import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';
import { PaymentMethod } from '../value-objects/payment-details';

export interface ExpenseScheduledProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  amount: MonetarySnapshot;
  paymentMethod: PaymentMethod;
  dueDate: Date;
}

export class ExpenseScheduled implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly amount: MonetarySnapshot;
  public readonly paymentMethod: PaymentMethod;
  public readonly dueDate: Date;

  constructor(props: ExpenseScheduledProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.amount = props.amount;
    this.paymentMethod = props.paymentMethod;
    this.dueDate = props.dueDate;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
