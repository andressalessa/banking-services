import { ExpenseDecision as PrismaExpenseDecision } from '@prisma/client';
import { Approval, Decision } from '@/modules/payment/domain/value-objects/approval';
import { DecisionStatus } from '@/modules/payment/domain/enums/approval-status';

export class PrismaApprovalMapper {
  static toDomain(
    requiredApprovalsCount: number,
    decisions: PrismaExpenseDecision[],
  ): Approval {
    return Approval.create({
      requiredApprovalsCount,
      decisions: decisions.map(PrismaApprovalMapper.decisionToDomain),
    });
  }

  static decisionToDomain(raw: PrismaExpenseDecision): Decision {
    return {
      approverPersonId: raw.approver_person_id,
      status: raw.decision_status as DecisionStatus,
      rejectionReason: raw.rejection_reason ?? undefined,
      createdAt: raw.created_at,
    };
  }

  static decisionsToPrisma(
    expenseId: string,
    decisions: Decision[],
  ): Array<{
    expense_id: string;
    approver_person_id: string;
    decision_status: DecisionStatus;
    rejection_reason: string | null;
    created_at: Date;
  }> {
    return decisions.map((decision) => ({
      expense_id: expenseId,
      approver_person_id: decision.approverPersonId,
      decision_status: decision.status,
      rejection_reason: decision.rejectionReason ?? null,
      created_at: decision.createdAt,
    }));
  }
}
