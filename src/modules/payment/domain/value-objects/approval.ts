import { DecisionStatus } from '../enums/approval-status';
import { ApprovalStatus } from '../enums/approval-status';

export interface Decision {
  approverPersonId: string;
  status: DecisionStatus;
  rejectionReason?: string;
  createdAt: Date;
}

export interface ApprovalProps {
  requiredApprovalsCount: number;
  decisions: Decision[];
}

export class Approval {
  private readonly props: ApprovalProps;

  private constructor(props: ApprovalProps) {
    this.props = props;
  }

  public static create(
    requiredApprovalsCount = 1,
    decisions: Decision[] = [],
  ): Approval {
    return new Approval({
      requiredApprovalsCount,
      decisions,
    });
  }

  public addDecision(decision: Decision): Approval {
    if (this.status !== ApprovalStatus.PENDING) {
      throw new Error(
        `Cannot add decision to an already ${this.status.toLowerCase()} approval process.`,
      );
    }

    const alreadyDecided = this.props.decisions.some(
      (d) => d.approverPersonId === decision.approverPersonId,
    );
    if (alreadyDecided) {
      throw new Error(
        'This approver has already submitted a decision for this expense.',
      );
    }

    return new Approval({
      ...this.props,
      decisions: [...this.props.decisions, decision],
    });
  }

  get status(): ApprovalStatus {
    const hasRejection = this.props.decisions.some(
      (d) => d.status === DecisionStatus.REJECTED,
    );
    if (hasRejection) return DecisionStatus.REJECTED;

    const validApprovalsCount = this.props.decisions.filter(
      (d) => d.status === DecisionStatus.APPROVED,
    ).length;
    if (validApprovalsCount >= this.props.requiredApprovalsCount) {
      return ApprovalStatus.APPROVED;
    }

    return ApprovalStatus.PENDING;
  }

  get requiredApprovalsCount(): number {
    return this.props.requiredApprovalsCount;
  }

  get decisions(): Decision[] {
    return this.props.decisions;
  }
}
