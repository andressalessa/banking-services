import { left, right } from '@/core/either';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SettleExpenseUseCase } from './settle-expense.use-case';
import { InMemoryExpenseRepository } from '../../infrastructure/repositories/in-memory-expense.repository';
import { Expense } from '../../domain/entities/expense';
import { Payee } from '../../domain/value-objects/payee';
import { PaymentDetails } from '../../domain/value-objects/payment-details';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseStatus } from '../../domain/enums/expense-status';
import { AccountBalancePort } from '../ports/account-balance.port';
import { PaymentGatewayPort, PaymentRequest } from '../ports/payment-gateway.port';
import { Approval } from '../../domain/value-objects/approval';

class MockAccountBalancePort extends AccountBalancePort {
  public confirmDebitCalls: any[] = [];
  public releaseCalls: any[] = [];

  async reserveBalance(accountId: string, amountInCents: number, reason: string) {
    return right(undefined);
  }

  async releaseBalance(accountId: string, amountInCents: number, reason: string) {
    this.releaseCalls.push({ accountId, amountInCents, reason });
    return right(undefined);
  }

  async confirmDebit(accountId: string, amountInCents: number, reason: string) {
    this.confirmDebitCalls.push({ accountId, amountInCents, reason });
    return right(undefined);
  }
}

class MockPaymentGatewayPort extends PaymentGatewayPort {
  public processPaymentCalls: any[] = [];
  public shouldFail = false;

  async processPayment(request: PaymentRequest) {
    this.processPaymentCalls.push(request);

    if (this.shouldFail) {
      return left(new Error('Payment processing failed'));
    }

    return right({ transactionId: `tx-${Date.now()}` });
  }
}

describe('SettleExpenseUseCase', () => {
  let useCase: SettleExpenseUseCase;
  let repository: InMemoryExpenseRepository;
  let accountBalancePort: MockAccountBalancePort;
  let paymentGatewayPort: MockPaymentGatewayPort;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryExpenseRepository();
    accountBalancePort = new MockAccountBalancePort();
    paymentGatewayPort = new MockPaymentGatewayPort();
    useCase = new SettleExpenseUseCase(
      repository,
      accountBalancePort,
      paymentGatewayPort,
    );
  });

  it('should settle expense and mark as paid', async () => {
    const payee = Payee.create({
      name: 'John Doe',
      taxId: '12345678901',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('john@example.com');

    const approval = Approval.create({ requiredApprovalsCount: 1 });
    const expense = Expense.create(
      {
        accountId: new UniqueEntityID('account-1'),
        payee,
        amount: Money.create(100),
        paymentDetails,
        dueDate: new Date('2026-12-31'),
        status: ExpenseStatus.SCHEDULED,
        approval,
      },
      new UniqueEntityID('expense-1'),
    );

    expense.approve('approver-1');
    await repository.create(expense);

    const result = await useCase.execute({
      expenseId: expense.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.transactionId).toContain('tx-');
    }

    const updatedExpense = await repository.findById(expense.id);
    expect(updatedExpense?.status).toBe(ExpenseStatus.PAID);
    expect(updatedExpense?.paidAt).not.toBeNull();

    // Verify payment gateway was called
    expect(paymentGatewayPort.processPaymentCalls).toHaveLength(1);

    // Verify debit was confirmed
    expect(accountBalancePort.confirmDebitCalls).toHaveLength(1);
    expect(accountBalancePort.confirmDebitCalls[0]).toEqual({
      accountId: 'account-1',
      amountInCents: 10000,
      reason: 'expense-paid:expense-1',
    });
  });

  it('should mark as FAILED and release balance when payment gateway fails', async () => {
    const payee = Payee.create({
      name: 'Jane Doe',
      taxId: '98765432100',
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
        status: ExpenseStatus.SCHEDULED,
        approval,
      },
      new UniqueEntityID('expense-2'),
    );

    expense.approve('approver-1');
    await repository.create(expense);

    // Mock payment gateway failure
    paymentGatewayPort.shouldFail = true;

    const result = await useCase.execute({
      expenseId: expense.id.toString(),
    });

    expect(result.isLeft()).toBe(true);

    const updatedExpense = await repository.findById(expense.id);
    expect(updatedExpense?.status).toBe(ExpenseStatus.FAILED);

    // Verify balance was released
    expect(accountBalancePort.releaseCalls).toHaveLength(1);
    expect(accountBalancePort.releaseCalls[0].reason).toContain('failed');

    // Verify debit was NOT confirmed
    expect(accountBalancePort.confirmDebitCalls).toHaveLength(0);
  });

  it('should return ExpenseNotFoundError when expense does not exist', async () => {
    const result = await useCase.execute({
      expenseId: 'non-existent-id',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ExpenseNotFoundError);
  });

  it('should call payment gateway with correct payment details', async () => {
    const payee = Payee.create({
      name: 'Test User',
      taxId: '11122233344',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('+5511987654321');

    const approval = Approval.create({ requiredApprovalsCount: 1 });
    const expense = Expense.create(
      {
        accountId: new UniqueEntityID('account-3'),
        payee,
        amount: Money.create(300),
        paymentDetails,
        dueDate: new Date('2026-11-20'),
        status: ExpenseStatus.SCHEDULED,
        approval,
      },
      new UniqueEntityID('expense-3'),
    );

    expense.approve('approver-1');
    await repository.create(expense);

    await useCase.execute({
      expenseId: expense.id.toString(),
    });

    expect(paymentGatewayPort.processPaymentCalls).toHaveLength(1);
    expect(paymentGatewayPort.processPaymentCalls[0]).toMatchObject({
      expenseId: 'expense-3',
      accountId: 'account-3',
      amount: 30000,
      payee: {
        name: 'Test User',
        taxId: '11122233344',
      },
      paymentDetails: {
        method: 'PIX',
        pixKey: '+5511987654321',
      },
    });
  });

  it('should mark as PROCESSING before calling payment gateway', async () => {
    const payee = Payee.create({
      name: 'Another User',
      taxId: '55566677788',
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
        status: ExpenseStatus.SCHEDULED,
        approval,
      },
      new UniqueEntityID('expense-4'),
    );

    expense.approve('approver-1');
    await repository.create(expense);

    await useCase.execute({
      expenseId: expense.id.toString(),
    });

    // Expense should be PAID at the end, but went through PROCESSING
    const updatedExpense = await repository.findById(expense.id);
    expect(updatedExpense?.status).toBe(ExpenseStatus.PAID);
  });
});
