import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';

export type ApprovalStatus = 'APPROVED' | 'REJECTED';

export interface ExpenseApprovalProps {
  approverPersonId: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  createdAt: Date;
}

export class ExpenseApproval extends Entity<ExpenseApprovalProps> {
  static create(
    props: Optional<ExpenseApprovalProps, 'createdAt'>,
    id?: UniqueEntityID,
  ): ExpenseApproval {
    return new ExpenseApproval(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  get approverPersonId(): string {
    return this.props.approverPersonId;
  }

  get status(): ApprovalStatus {
    return this.props.status;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
