import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';
import { PaymentMethod } from '../value-objects/payment-details';
import { ExpenseStatus } from '../enums/expense-status';

export interface ExpenseCreatedPayee {
  name: string;
  taxId: string;
  taxIdType: 'CPF' | 'CNPJ';
}

export interface ExpenseCreatedProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  payee: ExpenseCreatedPayee;
  amount: MonetarySnapshot;
  paymentMethod: PaymentMethod;
  requiredApprovalsCount: number;
  status: ExpenseStatus;
  dueDate: Date;
}

export class ExpenseCreated implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly payee: ExpenseCreatedPayee;
  public readonly amount: MonetarySnapshot;
  public readonly paymentMethod: PaymentMethod;
  public readonly requiredApprovalsCount: number;
  public readonly status: ExpenseStatus;
  public readonly dueDate: Date;

  constructor(props: ExpenseCreatedProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.payee = props.payee;
    this.amount = props.amount;
    this.paymentMethod = props.paymentMethod;
    this.requiredApprovalsCount = props.requiredApprovalsCount;
    this.status = props.status;
    this.dueDate = props.dueDate;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
