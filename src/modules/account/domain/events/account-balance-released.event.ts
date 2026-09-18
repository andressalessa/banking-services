import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';

export interface AccountBalanceReleasedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  releasedAmount: MonetarySnapshot;
  totalReservedBalance: MonetarySnapshot;
  availableBalance: MonetarySnapshot;
  reason: string;
}

export class AccountBalanceReleased implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly releasedAmount: MonetarySnapshot;
  public readonly totalReservedBalance: MonetarySnapshot;
  public readonly availableBalance: MonetarySnapshot;
  public readonly reason: string;

  constructor(props: AccountBalanceReleasedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.releasedAmount = props.releasedAmount;
    this.totalReservedBalance = props.totalReservedBalance;
    this.availableBalance = props.availableBalance;
    this.reason = props.reason;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
