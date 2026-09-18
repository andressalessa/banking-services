import { Approval } from '../value-objects/approval';

describe('Approval Value Object', () => {
  it('should start with PENDING status by default', () => {
    const approval = Approval.create({ requiredApprovalsCount: 1 });
    expect(approval.status).toBe('PENDING');
  });

  it('should transition to APPROVED when required approvals count is met', () => {
    const approval = Approval.create({ requiredApprovalsCount: 1 });
    const approved = approval.addDecision({
      approverPersonId: 'person-1',
      status: 'APPROVED',
      createdAt: new Date(),
    });

    expect(approved.status).toBe('APPROVED');
  });

  it('should handle multi-level approval thresholds correctly', () => {
    // Exige 2 aprovações (ex: > R$ 10.000)
    const approval = Approval.create({ requiredApprovalsCount: 2 });

    const step1 = approval.addDecision({
      approverPersonId: 'manager-1',
      status: 'APPROVED',
      createdAt: new Date(),
    });
    expect(step1.status).toBe('PENDING');

    const step2 = step1.addDecision({
      approverPersonId: 'director-1',
      status: 'APPROVED',
      createdAt: new Date(),
    });
    expect(step2.status).toBe('APPROVED');
  });

  it('should reject immediately if any approver rejects', () => {
    const approval = Approval.create({ requiredApprovalsCount: 2 });
    const rejected = approval.addDecision({
      approverPersonId: 'manager-1',
      status: 'REJECTED',
      rejectionReason: 'Invalid budget',
      createdAt: new Date(),
    });

    expect(rejected.status).toBe('REJECTED');
  });

  it('should prevent the same approver from deciding twice', () => {
    const approval = Approval.create({ requiredApprovalsCount: 2 });
    const step1 = approval.addDecision({
      approverPersonId: 'manager-1',
      status: 'APPROVED',
      createdAt: new Date(),
    });

    expect(() =>
      step1.addDecision({
        approverPersonId: 'manager-1',
        status: 'APPROVED',
        createdAt: new Date(),
      }),
    ).toThrow(
      'This approver has already submitted a decision for this expense.',
    );
  });
});
