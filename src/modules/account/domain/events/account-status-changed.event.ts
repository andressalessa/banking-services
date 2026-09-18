import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { AccountStatus } from '../enums/account-status';

export interface AccountStatusChangedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
}

export class AccountStatusChanged implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly previousStatus: AccountStatus;
  public readonly newStatus: AccountStatus;

  constructor(props: AccountStatusChangedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.previousStatus = props.previousStatus;
    this.newStatus = props.newStatus;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
