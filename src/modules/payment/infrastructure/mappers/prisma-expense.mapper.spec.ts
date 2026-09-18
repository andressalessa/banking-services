import type { ExpenseDecision } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Money } from '@/core/value-objects/money';
import { Expense } from '@/modules/payment/domain/entities/expense';
import { Approval } from '@/modules/payment/domain/value-objects/approval';
import { Payee } from '@/modules/payment/domain/value-objects/payee';
import { PaymentDetails } from '@/modules/payment/domain/value-objects/payment-details';
import { PrismaExpenseMapper } from './prisma-expense.mapper';

const EXPENSE_ID = '550e8400-e29b-41d4-a716-446655440000';
const ACCOUNT_ID = '660e8400-e29b-41d4-a716-446655440000';
const APPROVER_ID = '770e8400-e29b-41d4-a716-446655440000';

function makePrismaExpense(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-01-15T12:00:00.000Z');

  return {
    id: EXPENSE_ID,
    account_id: ACCOUNT_ID,
    payee_name: 'John Doe',
    payee_tax_id: '39053344705',
    payee_tax_id_type: 'CPF',
    payee_email: null,
    amount_cents: BigInt(10000),
    currency: 'BRL',
    payment_details: {
      method: 'PIX',
      pixKey: '39053344705',
      pixKeyType: 'CPF',
    },
    required_approvals_count: 1,
    approval_status: 'PENDING',
    status: 'DRAFT',
    due_date: new Date('2026-12-31T00:00:00.000Z'),
    paid_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    decisions: [] as ExpenseDecision[],
    ...overrides,
  };
}

describe('PrismaExpenseMapper', () => {
  describe('toDomain', () => {
    it('should convert Prisma expense to Domain expense without emitting events', () => {
      const expense = PrismaExpenseMapper.toDomain(makePrismaExpense() as never);

      expect(expense).toBeInstanceOf(Expense);
      expect(expense.id.toString()).toBe(EXPENSE_ID);
      expect(expense.accountId.toString()).toBe(ACCOUNT_ID);
      expect(expense.amount.amountInCents).toBe(10000);
      expect(expense.payee.name).toBe('John Doe');
      expect(expense.paymentDetails.isPix()).toBe(true);
      expect(expense.domainEvents).toHaveLength(0);
    });

    it('should restore approval decisions', () => {
      const decidedAt = new Date('2026-02-01T10:00:00.000Z');
      const expense = PrismaExpenseMapper.toDomain(
        makePrismaExpense({
          approval_status: 'APPROVED',
          decisions: [
            {
              id: '880e8400-e29b-41d4-a716-446655440000',
              expense_id: EXPENSE_ID,
              approver_person_id: APPROVER_ID,
              decision_status: 'APPROVED',
              rejection_reason: null,
              created_at: decidedAt,
            },
          ],
        }) as never,
      );

      expect(expense.approval.status).toBe('APPROVED');
      expect(expense.approval.decisions).toHaveLength(1);
      expect(expense.approval.decisions[0].approverPersonId).toBe(APPROVER_ID);
    });
  });

  describe('toPrisma', () => {
    it('should convert Domain expense to Prisma persistence payload', () => {
      const expense = Expense.create(
        {
          accountId: new UniqueEntityID(ACCOUNT_ID),
          payee: Payee.create({
            name: 'John Doe',
            taxId: '39053344705',
            taxIdType: 'CPF',
          }),
          amount: Money.create(100),
          paymentDetails: PaymentDetails.createPix('39053344705'),
          dueDate: new Date('2026-12-31T00:00:00.000Z'),
        },
        new UniqueEntityID(EXPENSE_ID),
      );

      const persistence = PrismaExpenseMapper.toPrisma(expense);

      expect(persistence.expense.id).toBe(EXPENSE_ID);
      expect(persistence.expense.account_id).toBe(ACCOUNT_ID);
      expect(persistence.expense.amount_cents).toBe(BigInt(10000));
      expect(persistence.expense.payee_name).toBe('John Doe');
      expect(persistence.expense.payment_details).toEqual({
        method: 'PIX',
        pixKey: '39053344705',
        pixKeyType: 'CPF',
      });
      expect(persistence.decisions).toHaveLength(0);
    });

    it('should persist approval decisions', () => {
      const expense = Expense.create(
        {
          accountId: new UniqueEntityID(ACCOUNT_ID),
          payee: Payee.create({
            name: 'John Doe',
            taxId: '39053344705',
            taxIdType: 'CPF',
          }),
          amount: Money.create(100),
          paymentDetails: PaymentDetails.createPix('39053344705'),
          dueDate: new Date('2026-12-31T00:00:00.000Z'),
          approval: Approval.create({
            requiredApprovalsCount: 1,
            decisions: [
              {
                approverPersonId: APPROVER_ID,
                status: 'APPROVED',
                createdAt: new Date('2026-02-01T10:00:00.000Z'),
              },
            ],
          }),
        },
        new UniqueEntityID(EXPENSE_ID),
      );

      const persistence = PrismaExpenseMapper.toPrisma(expense);

      expect(persistence.expense.approval_status).toBe('APPROVED');
      expect(persistence.decisions).toHaveLength(1);
      expect(persistence.decisions[0].approver_person_id).toBe(APPROVER_ID);
      expect(persistence.decisions[0].decision_status).toBe('APPROVED');
    });
  });
});
