import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';
import { PaymentMethod } from '../value-objects/payment-details';

export interface ExpenseProcessingProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  amount: MonetarySnapshot;
  paymentMethod: PaymentMethod;
}

export class ExpenseProcessing implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly amount: MonetarySnapshot;
  public readonly paymentMethod: PaymentMethod;

  constructor(props: ExpenseProcessingProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.amount = props.amount;
    this.paymentMethod = props.paymentMethod;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
