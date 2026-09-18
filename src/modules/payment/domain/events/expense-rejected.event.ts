import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';

export interface ExpenseRejectedProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  rejectorPersonId: string;
  rejectionReason: string;
}

export class ExpenseRejected implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly rejectorPersonId: string;
  public readonly rejectionReason: string;

  constructor(props: ExpenseRejectedProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.rejectorPersonId = props.rejectorPersonId;
    this.rejectionReason = props.rejectionReason;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
