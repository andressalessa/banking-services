import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';

export interface AccountCreditedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  creditedAmount: MonetarySnapshot;
  newBalance: MonetarySnapshot;
  availableBalance: MonetarySnapshot;
  reason: string;
}

export class AccountCredited implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly creditedAmount: MonetarySnapshot;
  public readonly newBalance: MonetarySnapshot;
  public readonly availableBalance: MonetarySnapshot;
  public readonly reason: string;

  constructor(props: AccountCreditedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.creditedAmount = props.creditedAmount;
    this.newBalance = props.newBalance;
    this.availableBalance = props.availableBalance;
    this.reason = props.reason;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
