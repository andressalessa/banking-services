import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MemberStatus } from '../entities/member';

export interface MemberStatusChangedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  memberId: string;
  personId: string;
  previousStatus: MemberStatus;
  newStatus: MemberStatus;
  isApprover: boolean;
}

export class MemberStatusChanged implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly memberId: string;
  public readonly personId: string;
  public readonly previousStatus: MemberStatus;
  public readonly newStatus: MemberStatus;
  public readonly isApprover: boolean;

  constructor(props: MemberStatusChangedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.memberId = props.memberId;
    this.personId = props.personId;
    this.previousStatus = props.previousStatus;
    this.newStatus = props.newStatus;
    this.isApprover = props.isApprover;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
