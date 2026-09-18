import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CreateExpenseUseCase } from './create-expense.use-case';
import { InMemoryExpenseRepository } from '../../infrastructure/repositories/in-memory-expense.repository';
import { Payee } from '../../domain/value-objects/payee';
import { PaymentDetails } from '../../domain/value-objects/payment-details';
import { ExpenseStatus } from '../../domain/enums/expense-status';

describe('CreateExpenseUseCase', () => {
  let useCase: CreateExpenseUseCase;
  let repository: InMemoryExpenseRepository;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryExpenseRepository();
    useCase = new CreateExpenseUseCase(repository);
  });

  it('should create expense successfully', async () => {
    const payee = Payee.create({
      name: 'John Doe',
      taxId: '12345678901',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('john@example.com');

    const result = await useCase.execute({
      accountId: 'account-1',
      payee,
      amount: Money.create(100),
      paymentDetails,
      dueDate: new Date('2026-12-31'),
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { expense } = result.value;
      expect(expense.accountId.toString()).toBe('account-1');
      expect(expense.amount.value).toBe(100);
      expect(expense.status).toBe(ExpenseStatus.DRAFT);
      expect(repository.items).toHaveLength(1);
      expect(repository.items[0]).toBe(expense);
    }
  });

  it('should create expense with correct payee', async () => {
    const payee = Payee.create({
      name: 'Company LTDA',
      taxId: '12345678000195',
      taxIdType: 'CNPJ',
    });

    const paymentDetails = PaymentDetails.createPix('+5511987654321');

    const result = await useCase.execute({
      accountId: 'account-2',
      payee,
      amount: Money.create(500),
      paymentDetails,
      dueDate: new Date('2027-01-15'),
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { expense } = result.value;
      expect(expense.payee.name).toBe('Company LTDA');
      expect(expense.payee.taxId).toBe('12345678000195');
      expect(expense.payee.taxIdType).toBe('CNPJ');
    }
  });

  it('should create expense with payment details', async () => {
    const payee = Payee.create({
      name: 'Jane Doe',
      taxId: '98765432100',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('jane@example.com');

    const result = await useCase.execute({
      accountId: 'account-3',
      payee,
      amount: Money.create(250),
      paymentDetails,
      dueDate: new Date('2026-11-20'),
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { expense } = result.value;
      expect(expense.paymentDetails.method).toBe('PIX');
      expect(expense.paymentDetails.pixKey).toBe('jane@example.com');
    }
  });

  it('should persist expense in repository', async () => {
    const payee = Payee.create({
      name: 'Test User',
      taxId: '11122233344',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('test@example.com');

    await useCase.execute({
      accountId: 'account-4',
      payee,
      amount: Money.create(1000),
      paymentDetails,
      dueDate: new Date('2027-03-01'),
    });

    expect(repository.items).toHaveLength(1);

    const savedExpense = await repository.findById(repository.items[0].id);
    expect(savedExpense).not.toBeNull();
    expect(savedExpense?.amount.value).toBe(1000);
  });

  it('should dispatch ExpenseCreated domain event', async () => {
    const events: any[] = [];
    DomainEvents.register(
      (event: any) => {
        events.push(event);
      },
      'ExpenseCreated',
    );

    const payee = Payee.create({
      name: 'Event Test',
      taxId: '55566677788',
      taxIdType: 'CPF',
    });

    const paymentDetails = PaymentDetails.createPix('event@example.com');

    await useCase.execute({
      accountId: 'account-5',
      payee,
      amount: Money.create(150),
      paymentDetails,
      dueDate: new Date('2026-12-25'),
    });

    expect(events.length).toBeGreaterThan(0);
  });
});
