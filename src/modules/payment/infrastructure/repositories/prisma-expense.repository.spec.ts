import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/core/infrastructure/database/prisma.service';
import { Money } from '@/core/value-objects/money';
import { Expense } from '@/modules/payment/domain/entities/expense';
import { Approval } from '@/modules/payment/domain/value-objects/approval';
import { makePayee } from '@/modules/payment/domain/test/factories/make-payee';
import { makePaymentDetails } from '@/modules/payment/domain/test/factories/make-payment-details';
import { PrismaExpenseRepository } from './prisma-expense.repository';
import { startPrismaTestDatabase } from 'test/setup-prisma-container';

describe('PrismaExpenseRepository (Integration)', () => {
  let container: Awaited<ReturnType<typeof startPrismaTestDatabase>>['container'];
  let prisma: PrismaService;
  let repository: PrismaExpenseRepository;

  beforeAll(async () => {
    const setup = await startPrismaTestDatabase();
    container = setup.container;
    prisma = setup.prisma;
    repository = new PrismaExpenseRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  function makePersistedExpense(overrides: { accountId?: UniqueEntityID } = {}) {
    return Expense.create({
      accountId: overrides.accountId ?? new UniqueEntityID(),
      payee: makePayee(),
      amount: Money.create(100),
      paymentDetails: makePaymentDetails(),
      dueDate: new Date('2026-12-31T00:00:00.000Z'),
    });
  }

  describe('create / findById', () => {
    it('should persist and retrieve an expense', async () => {
      const expense = makePersistedExpense();

      await repository.create(expense);

      const found = await repository.findById(expense.id);

      expect(found).not.toBeNull();
      expect(found!.id.toString()).toBe(expense.id.toString());
      expect(found!.amount.amountInCents).toBe(10000);
      expect(found!.payee.name).toBe(expense.payee.name);
      expect(found!.paymentDetails.isPix()).toBe(true);
      expect(found!.domainEvents).toHaveLength(0);
    });

    it('should return null if expense is not found', async () => {
      const found = await repository.findById(new UniqueEntityID());

      expect(found).toBeNull();
    });
  });

  describe('save', () => {
    it('should update an existing expense and persist approval decisions', async () => {
      const approverPersonId = new UniqueEntityID().toString();
      const expense = Expense.create({
        accountId: new UniqueEntityID(),
        payee: makePayee(),
        amount: Money.create(250),
        paymentDetails: makePaymentDetails(),
        dueDate: new Date('2026-12-31T00:00:00.000Z'),
        approval: Approval.create({ requiredApprovalsCount: 1 }),
      });

      await repository.create(expense);

      expense.approve(approverPersonId);
      await repository.save(expense);

      const found = await repository.findById(expense.id);

      expect(found).not.toBeNull();
      expect(found!.approval.status).toBe('APPROVED');
      expect(found!.approval.decisions).toHaveLength(1);
      expect(found!.approval.decisions[0].approverPersonId).toBe(
        approverPersonId,
      );
    });
  });

  describe('findByAccountId', () => {
    it('should return all expenses for an account ordered by newest first', async () => {
      const accountId = new UniqueEntityID();
      const first = makePersistedExpense({ accountId });
      const second = makePersistedExpense({ accountId });
      const other = makePersistedExpense();

      await repository.create(first);
      await repository.create(second);
      await repository.create(other);

      const expenses = await repository.findByAccountId(accountId);

      expect(expenses).toHaveLength(2);
      expect(expenses.map((item) => item.id.toString()).sort()).toEqual(
        [first.id.toString(), second.id.toString()].sort(),
      );
    });
  });

  describe('delete', () => {
    it('should soft-delete an expense so findById ignores it', async () => {
      const expense = makePersistedExpense();

      await repository.create(expense);
      await repository.delete(expense.id);

      const found = await repository.findById(expense.id);
      const raw = await prisma.expense.findUnique({
        where: { id: expense.id.toString() },
      });

      expect(found).toBeNull();
      expect(raw).not.toBeNull();
      expect(raw!.deleted_at).not.toBeNull();
    });
  });
});
