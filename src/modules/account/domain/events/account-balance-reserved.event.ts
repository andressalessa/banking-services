import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';

export interface AccountBalanceReservedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  reservedAmount: MonetarySnapshot;
  totalReservedBalance: MonetarySnapshot;
  availableBalance: MonetarySnapshot;
  reason: string;
}

export class AccountBalanceReserved implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly reservedAmount: MonetarySnapshot;
  public readonly totalReservedBalance: MonetarySnapshot;
  public readonly availableBalance: MonetarySnapshot;
  public readonly reason: string;

  constructor(props: AccountBalanceReservedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.reservedAmount = props.reservedAmount;
    this.totalReservedBalance = props.totalReservedBalance;
    this.availableBalance = props.availableBalance;
    this.reason = props.reason;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
