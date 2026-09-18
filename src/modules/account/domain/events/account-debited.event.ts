import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';

export interface AccountDebitedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  debitedAmount: MonetarySnapshot;
  newBalance: MonetarySnapshot;
  newReservedBalance: MonetarySnapshot;
  availableBalance: MonetarySnapshot;
  reason: string;
}

export class AccountDebited implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly debitedAmount: MonetarySnapshot;
  public readonly newBalance: MonetarySnapshot;
  public readonly newReservedBalance: MonetarySnapshot;
  public readonly availableBalance: MonetarySnapshot;
  public readonly reason: string;

  constructor(props: AccountDebitedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.debitedAmount = props.debitedAmount;
    this.newBalance = props.newBalance;
    this.newReservedBalance = props.newReservedBalance;
    this.availableBalance = props.availableBalance;
    this.reason = props.reason;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
