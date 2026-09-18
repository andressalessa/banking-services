import { left, right } from '@/core/either';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ScheduleExpenseUseCase } from './schedule-expense.use-case';
import { InMemoryExpenseRepository } from '../../infrastructure/repositories/in-memory-expense.repository';
import { Expense } from '../../domain/entities/expense';
import { Payee } from '../../domain/value-objects/payee';
import { PaymentDetails } from '../../domain/value-objects/payment-details';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseStatus } from '../../domain/enums/expense-status';
import { AccountBalancePort } from '../ports/account-balance.port';
import { InsufficientBalanceError } from '../../../account/domain/errors/insufficient-balance-error';
import { ApprovalStatus } from '../../domain/enums/approval-status';
import { Approval } from '../../domain/value-objects/approval';

class MockAccountBalancePort extends AccountBalancePort {
  public reserveCalls: any[] = [];
  public releaseCalls: any[] = [];
  public shouldFailReserve = false;

  async reserveBalance(accountId: string, amountInCents: number, reason: string) {
    this.reserveCalls.push({ accountId, amountInCents, reason });

    if (this.shouldFailReserve) {
      return left(new InsufficientBalanceError());
    }

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

describe('ScheduleExpenseUseCase', () => {
  let useCase: ScheduleExpenseUseCase;
  let repository: InMemoryExpenseRepository;
  let accountBalancePort: MockAccountBalancePort;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryExpenseRepository();
    accountBalancePort = new MockAccountBalancePort();
    useCase = new ScheduleExpenseUseCase(repository, accountBalancePort);
  });

  it('should schedule expense and reserve balance', async () => {
    const payee = Payee.create({
      name: 'John Doe',
      taxId: '39053344705',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('john@example.com');

    // Create approved expense
    const approval = Approval.create({ requiredApprovalsCount: 1 });
    const expense = Expense.create(
      {
        accountId: new UniqueEntityID('account-1'),
        payee,
        amount: Money.create(100),
        paymentDetails,
        dueDate: new Date('2026-12-31'),
        approval,
      },
      new UniqueEntityID('expense-1'),
    );

    // Approve to allow scheduling
    expense.approve('approver-1');
    await repository.create(expense);

    const result = await useCase.execute({
      expenseId: expense.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    const updatedExpense = await repository.findById(expense.id);
    expect(updatedExpense?.status).toBe(ExpenseStatus.SCHEDULED);

    // Verify balance was reserved
    expect(accountBalancePort.reserveCalls).toHaveLength(1);
    expect(accountBalancePort.reserveCalls[0]).toEqual({
      accountId: 'account-1',
      amountInCents: 10000,
      reason: 'expense:expense-1',
    });
  });

  it('should not schedule when insufficient balance', async () => {
    const payee = Payee.create({
      name: 'Jane Doe',
      taxId: '52998224725',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('jane@example.com');

    const approval = Approval.create({ requiredApprovalsCount: 1 });
    const expense = Expense.create(
      {
        accountId: new UniqueEntityID('account-2'),
        payee,
        amount: Money.create(200),
        paymentDetails,
        dueDate: new Date('2027-01-15'),
        approval,
      },
      new UniqueEntityID('expense-2'),
    );

    expense.approve('approver-1');
    await repository.create(expense);

    // Mock insufficient balance
    accountBalancePort.shouldFailReserve = true;

    const result = await useCase.execute({
      expenseId: expense.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InsufficientBalanceError);

    // Verify expense was NOT scheduled
    const updatedExpense = await repository.findById(expense.id);
    expect(updatedExpense?.status).toBe(ExpenseStatus.DRAFT);
  });

  it('should return ExpenseNotFoundError when expense does not exist', async () => {
    const result = await useCase.execute({
      expenseId: 'non-existent-id',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ExpenseNotFoundError);
  });

  it('should not call reserve when expense not found', async () => {
    await useCase.execute({
      expenseId: 'non-existent-id',
    });

    expect(accountBalancePort.reserveCalls).toHaveLength(0);
  });

  it('should release balance if scheduling fails after reservation', async () => {
    const payee = Payee.create({
      name: 'Test User',
      taxId: '28664221120',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('test@example.com');

    // Create expense already scheduled (will fail when trying to schedule again)
    const expense = Expense.create(
      {
        accountId: new UniqueEntityID('account-3'),
        payee,
        amount: Money.create(300),
        paymentDetails,
        dueDate: new Date('2026-11-20'),
        status: ExpenseStatus.SCHEDULED,
      },
      new UniqueEntityID('expense-3'),
    );

    await repository.create(expense);

    const result = await useCase.execute({
      expenseId: expense.id.toString(),
    });

    expect(result.isLeft()).toBe(true);

    // Verify balance was released after scheduling failure
    expect(accountBalancePort.reserveCalls).toHaveLength(1);
    expect(accountBalancePort.releaseCalls).toHaveLength(1);
    expect(accountBalancePort.releaseCalls[0].reason).toContain('failed');
  });
});
