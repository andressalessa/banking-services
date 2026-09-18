import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ManageExpenseApprovalUseCase } from './manage-expense-approval.use-case';
import { InMemoryExpenseRepository } from '../../infrastructure/repositories/in-memory-expense.repository';
import { Expense } from '../../domain/entities/expense';
import { Payee } from '../../domain/value-objects/payee';
import { PaymentDetails } from '../../domain/value-objects/payment-details';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ApprovalStatus } from '../../domain/enums/approval-status';

describe('ManageExpenseApprovalUseCase', () => {
  let useCase: ManageExpenseApprovalUseCase;
  let repository: InMemoryExpenseRepository;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryExpenseRepository();
    useCase = new ManageExpenseApprovalUseCase(repository);
  });

  describe('approve', () => {
    it('should approve expense successfully', async () => {
      const payee = Payee.create({
        name: 'John Doe',
        taxId: '12345678901',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('john@example.com');

      const expense = Expense.create({
        accountId: new UniqueEntityID('account-1'),
        payee,
        amount: Money.create(100),
        paymentDetails,
        dueDate: new Date('2026-12-31'),
      });

      await repository.create(expense);

      const result = await useCase.approve({
        expenseId: expense.id.toString(),
        approverPersonId: 'approver-1',
      });

      expect(result.isRight()).toBe(true);

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.approval.decisions).toHaveLength(1);
      expect(updatedExpense?.approval.decisions[0].approverPersonId).toBe(
        'approver-1',
      );
    });

    it('should return ExpenseNotFoundError when expense does not exist', async () => {
      const result = await useCase.approve({
        expenseId: 'non-existent-id',
        approverPersonId: 'approver-1',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ExpenseNotFoundError);
    });

    it('should mark approval as APPROVED when required approvals reached', async () => {
      const payee = Payee.create({
        name: 'Jane Doe',
        taxId: '98765432100',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('jane@example.com');

      const expense = Expense.create({
        accountId: new UniqueEntityID('account-2'),
        payee,
        amount: Money.create(200),
        paymentDetails,
        dueDate: new Date('2027-01-15'),
      });

      await repository.create(expense);

      // First approval
      await useCase.approve({
        expenseId: expense.id.toString(),
        approverPersonId: 'approver-1',
      });

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.approval.status).toBe(ApprovalStatus.APPROVED);
    });
  });

  describe('reject', () => {
    it('should reject expense successfully', async () => {
      const payee = Payee.create({
        name: 'Test User',
        taxId: '11122233344',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('test@example.com');

      const expense = Expense.create({
        accountId: new UniqueEntityID('account-3'),
        payee,
        amount: Money.create(300),
        paymentDetails,
        dueDate: new Date('2026-11-20'),
      });

      await repository.create(expense);

      const result = await useCase.reject({
        expenseId: expense.id.toString(),
        rejectorPersonId: 'rejector-1',
        reason: 'Invalid documentation',
      });

      expect(result.isRight()).toBe(true);

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.approval.decisions).toHaveLength(1);
      expect(updatedExpense?.approval.decisions[0].rejectionReason).toBe(
        'Invalid documentation',
      );
    });

    it('should return error when rejection reason is empty', async () => {
      const payee = Payee.create({
        name: 'Another User',
        taxId: '55566677788',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('another@example.com');

      const expense = Expense.create({
        accountId: new UniqueEntityID('account-4'),
        payee,
        amount: Money.create(400),
        paymentDetails,
        dueDate: new Date('2027-02-10'),
      });

      await repository.create(expense);

      const result = await useCase.reject({
        expenseId: expense.id.toString(),
        rejectorPersonId: 'rejector-1',
        reason: '',
      });

      expect(result.isLeft()).toBe(true);
    });

    it('should return ExpenseNotFoundError when expense does not exist', async () => {
      const result = await useCase.reject({
        expenseId: 'non-existent-id',
        rejectorPersonId: 'rejector-1',
        reason: 'Some reason',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ExpenseNotFoundError);
    });

    it('should mark approval as REJECTED', async () => {
      const payee = Payee.create({
        name: 'Final User',
        taxId: '99988877766',
        taxIdType: 'CPF',
      });

      const paymentDetails = PaymentDetails.createPix('final@example.com');

      const expense = Expense.create({
        accountId: new UniqueEntityID('account-5'),
        payee,
        amount: Money.create(500),
        paymentDetails,
        dueDate: new Date('2027-03-01'),
      });

      await repository.create(expense);

      await useCase.reject({
        expenseId: expense.id.toString(),
        rejectorPersonId: 'rejector-1',
        reason: 'Budget exceeded',
      });

      const updatedExpense = await repository.findById(expense.id);
      expect(updatedExpense?.approval.status).toBe(ApprovalStatus.REJECTED);
    });
  });
});
