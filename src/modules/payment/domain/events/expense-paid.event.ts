import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';
import { PaymentMethod } from '../value-objects/payment-details';

export interface ExpensePaidPayee {
  name: string;
  taxId: string;
}

export interface ExpensePaidProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  amount: MonetarySnapshot;
  payee: ExpensePaidPayee;
  paymentMethod: PaymentMethod;
  paidAt: Date;
}

export class ExpensePaid implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly amount: MonetarySnapshot;
  public readonly payee: ExpensePaidPayee;
  public readonly paymentMethod: PaymentMethod;
  public readonly paidAt: Date;

  constructor(props: ExpensePaidProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.amount = props.amount;
    this.payee = props.payee;
    this.paymentMethod = props.paymentMethod;
    this.paidAt = props.paidAt;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
