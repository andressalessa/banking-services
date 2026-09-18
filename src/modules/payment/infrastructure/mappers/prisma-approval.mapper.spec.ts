import { PrismaApprovalMapper } from './prisma-approval.mapper';
import { Approval } from '@/modules/payment/domain/value-objects/approval';

const EXPENSE_ID = '550e8400-e29b-41d4-a716-446655440099';
const APPROVER_ID = '660e8400-e29b-41d4-a716-446655440099';

describe('PrismaApprovalMapper', () => {
  it('should restore Approval from required count and decisions', () => {
    const decidedAt = new Date('2026-03-01T12:00:00.000Z');

    const approval = PrismaApprovalMapper.toDomain(1, [
      {
        id: '770e8400-e29b-41d4-a716-446655440099',
        expense_id: EXPENSE_ID,
        approver_person_id: APPROVER_ID,
        decision_status: 'APPROVED',
        rejection_reason: null,
        created_at: decidedAt,
      },
    ]);

    expect(approval).toBeInstanceOf(Approval);
    expect(approval.status).toBe('APPROVED');
    expect(approval.decisions[0]).toEqual({
      approverPersonId: APPROVER_ID,
      status: 'APPROVED',
      rejectionReason: undefined,
      createdAt: decidedAt,
    });
  });

  it('should convert domain decisions to Prisma rows', () => {
    const createdAt = new Date('2026-03-01T12:00:00.000Z');
    const rows = PrismaApprovalMapper.decisionsToPrisma(EXPENSE_ID, [
      {
        approverPersonId: APPROVER_ID,
        status: 'REJECTED',
        rejectionReason: 'Duplicate invoice',
        createdAt,
      },
    ]);

    expect(rows).toEqual([
      {
        expense_id: EXPENSE_ID,
        approver_person_id: APPROVER_ID,
        decision_status: 'REJECTED',
        rejection_reason: 'Duplicate invoice',
        created_at: createdAt,
      },
    ]);
  });
});
