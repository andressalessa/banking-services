import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MemberRole, MemberStatus } from '../entities/member';

export interface MemberAddedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  memberId: string;
  personId: string;
  role: MemberRole;
  status: MemberStatus;
}

export class MemberAdded implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly memberId: string;
  public readonly personId: string;
  public readonly role: MemberRole;
  public readonly status: MemberStatus;

  constructor(props: MemberAddedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.memberId = props.memberId;
    this.personId = props.personId;
    this.role = props.role;
    this.status = props.status;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
