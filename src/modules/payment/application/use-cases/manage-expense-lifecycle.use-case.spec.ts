import { right } from '@/core/either';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ManageExpenseLifecycleUseCase } from './manage-expense-lifecycle.use-case';
import { InMemoryExpenseRepository } from '../../infrastructure/repositories/in-memory-expense.repository';
import { Expense } from '../../domain/entities/expense';
import { Payee } from '../../domain/value-objects/payee';
import { PaymentDetails } from '../../domain/value-objects/payment-details';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseStatus } from '../../domain/enums/expense-status';
import { AccountBalancePort } from '../ports/account-balance.port';
import { Approval } from '../../domain/value-objects/approval';

class MockAccountBalancePort extends AccountBalancePort {
  public releaseCalls: any[] = [];

  async reserveBalance(accountId: string, amountInCents: number, reason: string) {
    return right(undefined);
  }

  async releaseBalance(accountId: string, amountInCents: number, reason: string) {
    this.releaseCalls.push({ accountId, amountInCents, reason });
    return right(undefined);
  }

  async confirmDebit(accountId: string, amountInCents: number, reason: string) {
    return right(undefined);
  }
}

describe('ManageExpenseLifecycleUseCase', () => {
  let useCase: ManageExpenseLifecycleUseCase;
  let repository: InMemoryExpenseRepository;
  let accountBalancePort: MockAccountBalancePort;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryExpenseRepository();
    accountBalancePort = new MockAccountBalancePort();
    useCase = new ManageExpenseLifecycleUseCase(repository, accountBalancePort);
  });

  describe('cancel', () => {
    it('should cancel scheduled expense and release balance', async () => {
      const payee = Payee.create({
        name: 'John Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('john@example.com');

      const expense = Expense.create(
        {
          accountId: new UniqueEntityID('account-1'),
          payee,
          amount: Money.create(100),
          paymentDetails,
          dueDate: new Date('2026-12-31'),
          status: ExpenseStatus.SCHEDULED,
        },
        new UniqueEntityID('expense-1'),
      );

      await repository.create(expense);

      const result = await useCase.cancel({
        expenseId: expense.id.toString(),
      });

      expect(result.isRight()).toBe(true);

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.status).toBe(ExpenseStatus.CANCELLED);

      // Verify balance was released
      expect(accountBalancePort.releaseCalls).toHaveLength(1);
      expect(accountBalancePort.releaseCalls[0]).toEqual({
        accountId: 'account-1',
        amountInCents: 10000,
        reason: 'expense-cancelled:expense-1',
      });
    });

    it('should cancel draft expense without releasing balance', async () => {
      const payee = Payee.create({
        name: 'Jane Doe',
        taxId: '52998224725',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('jane@example.com');

      const expense = Expense.create(
        {
          accountId: new UniqueEntityID('account-2'),
          payee,
          amount: Money.create(200),
          paymentDetails,
          dueDate: new Date('2027-01-15'),
          status: ExpenseStatus.DRAFT,
        },
        new UniqueEntityID('expense-2'),
      );

      await repository.create(expense);

      const result = await useCase.cancel({
        expenseId: expense.id.toString(),
      });

      expect(result.isRight()).toBe(true);

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.status).toBe(ExpenseStatus.CANCELLED);

      // Verify balance was NOT released (wasn't scheduled)
      expect(accountBalancePort.releaseCalls).toHaveLength(0);
    });

    it('should return error when trying to cancel paid expense', async () => {
      const payee = Payee.create({
        name: 'Test User',
        taxId: '28664221120',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('test@example.com');

      const approval = Approval.create({ requiredApprovalsCount: 1 });
      const expense = Expense.create(
        {
          accountId: new UniqueEntityID('account-3'),
          payee,
          amount: Money.create(300),
          paymentDetails,
          dueDate: new Date('2026-11-20'),
          status: ExpenseStatus.PAID,
          approval,
        },
        new UniqueEntityID('expense-3'),
      );

      expense.approve('approver-1');
      await repository.create(expense);

      const result = await useCase.cancel({
        expenseId: expense.id.toString(),
      });

      expect(result.isLeft()).toBe(true);
    });

    it('should return ExpenseNotFoundError when expense does not exist', async () => {
      const result = await useCase.cancel({
        expenseId: 'non-existent-id',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ExpenseNotFoundError);
    });
  });

  describe('refund', () => {
    it('should refund paid expense', async () => {
      const payee = Payee.create({
        name: 'Another User',
        taxId: '56155388130',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('another@example.com');

      const approval = Approval.create({ requiredApprovalsCount: 1 });
      const expense = Expense.create(
        {
          accountId: new UniqueEntityID('account-4'),
          payee,
          amount: Money.create(400),
          paymentDetails,
          dueDate: new Date('2027-02-10'),
          status: ExpenseStatus.PAID,
          approval,
          paidAt: new Date('2026-09-15'),
        },
        new UniqueEntityID('expense-4'),
      );

      expense.approve('approver-1');
      await repository.create(expense);

      const result = await useCase.refund({
        expenseId: expense.id.toString(),
      });

      expect(result.isRight()).toBe(true);

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.status).toBe(ExpenseStatus.REFUNDED);
    });

    it('should NOT directly credit balance (handled by domain event)', async () => {
      const payee = Payee.create({
        name: 'Final User',
        taxId: '89933024302',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('final@example.com');

      const approval = Approval.create({ requiredApprovalsCount: 1 });
      const expense = Expense.create(
        {
          accountId: new UniqueEntityID('account-5'),
          payee,
          amount: Money.create(500),
          paymentDetails,
          dueDate: new Date('2027-03-01'),
          status: ExpenseStatus.PAID,
          approval,
          paidAt: new Date('2026-09-16'),
        },
        new UniqueEntityID('expense-5'),
      );

      expense.approve('approver-1');
      await repository.create(expense);

      await useCase.refund({
        expenseId: expense.id.toString(),
      });

      // Credit will be done via Domain Event by Account context
      // So no direct calls to account balance port
      expect(accountBalancePort.releaseCalls).toHaveLength(0);
    });

    it('should return error when trying to refund non-paid expense', async () => {
      const payee = Payee.create({
        name: 'Draft User',
        taxId: '23810943770',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('draft@example.com');

      const expense = Expense.create(
        {
          accountId: new UniqueEntityID('account-6'),
          payee,
          amount: Money.create(600),
          paymentDetails,
          dueDate: new Date('2027-04-01'),
          status: ExpenseStatus.DRAFT,
        },
        new UniqueEntityID('expense-6'),
      );

      await repository.create(expense);

      const result = await useCase.refund({
        expenseId: expense.id.toString(),
      });

      expect(result.isLeft()).toBe(true);
    });

    it('should return ExpenseNotFoundError when expense does not exist', async () => {
      const result = await useCase.refund({
        expenseId: 'non-existent-id',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ExpenseNotFoundError);
    });
  });
});
