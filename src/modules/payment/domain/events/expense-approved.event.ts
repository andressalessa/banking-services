import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { MonetarySnapshot } from '@/core/events/monetary-snapshot';
import { ApprovalStatus } from '../enums/approval-status';

export interface ExpenseApprovedProps {
  aggregateId: UniqueEntityID;
  expenseId: string;
  accountId: string;
  approverPersonId: string;
  approvalCount: number;
  requiredApprovalsCount: number;
  workflowStatus: ApprovalStatus;
  amount: MonetarySnapshot;
}

export class ExpenseApproved implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly expenseId: string;
  public readonly accountId: string;
  public readonly approverPersonId: string;
  public readonly approvalCount: number;
  public readonly requiredApprovalsCount: number;
  public readonly workflowStatus: ApprovalStatus;
  public readonly amount: MonetarySnapshot;

  constructor(props: ExpenseApprovedProps) {
    this.aggregateId = props.aggregateId;
    this.expenseId = props.expenseId;
    this.accountId = props.accountId;
    this.approverPersonId = props.approverPersonId;
    this.approvalCount = props.approvalCount;
    this.requiredApprovalsCount = props.requiredApprovalsCount;
    this.workflowStatus = props.workflowStatus;
    this.amount = props.amount;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
