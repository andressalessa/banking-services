import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { ExpenseStatus } from '../enums/expense-status';
import { ExpenseIsNotApprovedError } from '../errors/expense-is-not-approved';
import { ExpenseApproved } from '../events/expense-approved.event';
import { ExpenseCancelled } from '../events/expense-cancelled.event';
import { ExpenseCreated } from '../events/expense-created.event';
import { ExpenseFailed } from '../events/expense-failed.event';
import { ExpensePaid } from '../events/expense-paid.event';
import { ExpenseProcessing } from '../events/expense-processing.event';
import { ExpenseRefunded } from '../events/expense-refunded.event';
import { ExpenseRejected } from '../events/expense-rejected.event';
import { ExpenseScheduled } from '../events/expense-scheduled.event';
import { Approval } from '../value-objects/approval';
import { Payee } from '../value-objects/payee';
import { PaymentDetails } from '../value-objects/payment-details';
import { Expense } from './expense';

describe('Expense Aggregate Root', () => {
  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  const makePayee = () =>
    Payee.create({
      name: 'Example Payee',
      taxId: '12345678000195',
      taxIdType: 'CNPJ',
    });

  const makePaymentDetails = () =>
    PaymentDetails.create({
      method: 'PIX',
      pixKey: 'example@example.com',
      pixKeyType: 'EMAIL',
    });

  const makeExpense = (
    overrides?: Partial<{
      accountId: UniqueEntityID;
      approval: Approval;
      status: ExpenseStatus;
    }>,
  ) =>
    Expense.create({
      accountId: overrides?.accountId ?? new UniqueEntityID('account-1'),
      payee: makePayee(),
      amount: Money.create(500),
      paymentDetails: makePaymentDetails(),
      dueDate: new Date('2026-09-20'),
      approval: overrides?.approval,
      status: overrides?.status,
    });

  it('should create an expense with DRAFT status and PENDING approval by default', () => {
    const expense = makeExpense();

    expect(expense.status).toBe('DRAFT');
    expect(expense.approval.status).toBe('PENDING');
    expect(expense.paidAt).toBeNull();
    expect(expense.accountId.toValue()).toBe('account-1');
    expect(expense.amount.value).toBe(500);
    expect(expense.payee.taxId).toBe('12345678000195');
    expect(expense.paymentDetails.method).toBe('PIX');
    expect(expense.createdAt).toBeInstanceOf(Date);
  });

  it('should accept a custom unique entity id', () => {
    const id = new UniqueEntityID('expense-1');
    const expense = Expense.create(
      {
        accountId: new UniqueEntityID('account-1'),
        payee: makePayee(),
        amount: Money.create(500),
        paymentDetails: makePaymentDetails(),
        dueDate: new Date(),
      },
      id,
    );

    expect(expense.id.equals(id)).toBe(true);
  });

  it('should approve an expense when the required approvals count is met', () => {
    const expense = makeExpense();

    expense.approve('approver-person-id');

    expect(expense.approval.status).toBe('APPROVED');
    expect(expense.status).toBe('DRAFT');
    expect(expense.approval.decisions).toHaveLength(1);
    expect(expense.approval.decisions[0].approverPersonId).toBe(
      'approver-person-id',
    );
  });

  it('should keep approval PENDING until the required approvals count is met', () => {
    const expense = makeExpense({
      approval: Approval.create({ requiredApprovalsCount: 2 }),
    });

    expense.approve('manager-1');

    expect(expense.approval.status).toBe('PENDING');
    expect(() => expense.markAsPaid()).toThrow(ExpenseIsNotApprovedError);
  });

  it('should allow payment after all required approvals', () => {
    const expense = makeExpense({
      approval: Approval.create({ requiredApprovalsCount: 2 }),
    });

    expense.approve('manager-1');
    expense.approve('director-1');
    expense.markAsPaid();

    expect(expense.status).toBe('PAID');
    expect(expense.paidAt).toBeInstanceOf(Date);
  });

  it('should reject an expense with a reason', () => {
    const expense = makeExpense();

    expense.reject('approver-person-id', 'Out of budget');

    expect(expense.approval.status).toBe('REJECTED');
    expect(expense.status).toBe('DRAFT');
    expect(expense.approval.decisions[0].rejectionReason).toBe('Out of budget');
  });

  it('should throw when rejecting without a reason', () => {
    const expense = makeExpense();

    expect(() => expense.reject('approver-person-id', '')).toThrow(
      'Rejection reason is required.',
    );
    expect(() => expense.reject('approver-person-id', '   ')).toThrow(
      'Rejection reason is required.',
    );
    expect(expense.approval.status).toBe('PENDING');
  });

  it('should not allow a second decision after rejection', () => {
    const expense = makeExpense({
      approval: Approval.create(2),
    });

    expense.reject('manager-1', 'Invalid budget');

    expect(() => expense.approve('director-1')).toThrow(
      'Cannot add decision to an already rejected approval process.',
    );
  });

  it('should not allow the same approver to decide twice', () => {
    const expense = makeExpense({
      approval: Approval.create({ requiredApprovalsCount: 2 }),
    });

    expense.approve('manager-1');

    expect(() => expense.approve('manager-1')).toThrow(
      'This approver has already submitted a decision for this expense.',
    );
  });

  it('should throw when trying to pay an unapproved expense', () => {
    const expense = makeExpense();

    expect(() => expense.markAsPaid()).toThrow(ExpenseIsNotApprovedError);
    expect(expense.status).toBe('DRAFT');
    expect(expense.paidAt).toBeNull();
  });

  it('should throw when trying to pay a rejected expense', () => {
    const expense = makeExpense();

    expense.reject('approver-person-id', 'Out of budget');

    expect(() => expense.markAsPaid()).toThrow(ExpenseIsNotApprovedError);
  });

  it('should cancel a draft expense', () => {
    const expense = makeExpense();

    expense.cancel();

    expect(expense.status).toBe('CANCELLED');
  });

  it('should cancel an approved expense that has not been paid', () => {
    const expense = makeExpense();

    expense.approve('approver-person-id');
    expense.cancel();

    expect(expense.status).toBe('CANCELLED');
    expect(expense.approval.status).toBe('APPROVED');
  });

  it('should not pay a cancelled expense', () => {
    const expense = makeExpense();

    expense.approve('approver-person-id');
    expense.cancel();

    expect(() => expense.markAsPaid()).toThrow(
      'Cannot pay a cancelled expense.',
    );
    expect(expense.status).toBe('CANCELLED');
    expect(expense.paidAt).toBeNull();
  });

  it('should not cancel an already paid expense', () => {
    const expense = makeExpense();

    expense.approve('approver-person-id');
    expense.markAsPaid();

    expect(() => expense.cancel()).toThrow(
      'Cannot cancel an already paid expense.',
    );
    expect(expense.status).toBe('PAID');
  });

  describe('domain events', () => {
    it('should emit ExpenseCreated when an expense is created', () => {
      const expense = makeExpense();

      expect(expense.domainEvents).toHaveLength(1);
      expect(expense.domainEvents[0]).toBeInstanceOf(ExpenseCreated);
    });

    it('should not emit ExpenseApproved until the required alçada is met', () => {
      const expense = makeExpense({
        approval: Approval.create({ requiredApprovalsCount: 2 }),
      });
      expense.clearEvents();

      expense.approve('manager-1');

      expect(
        expense.domainEvents.filter(
          (event) => event instanceof ExpenseApproved,
        ),
      ).toHaveLength(0);

      expense.approve('director-1');

      expect(expense.domainEvents[0]).toBeInstanceOf(ExpenseApproved);
    });

    it('should emit ExpenseRejected when an expense is rejected', () => {
      const expense = makeExpense();
      expense.clearEvents();

      expense.reject('approver-person-id', 'Out of budget');

      expect(expense.domainEvents[0]).toBeInstanceOf(ExpenseRejected);
    });

    it('should emit lifecycle events for schedule, process, fail, pay, cancel and refund', () => {
      const scheduled = makeExpense();
      scheduled.approve('approver-person-id');
      scheduled.clearEvents();
      scheduled.schedule();
      expect(scheduled.domainEvents[0]).toBeInstanceOf(ExpenseScheduled);

      const processing = makeExpense();
      processing.approve('approver-person-id');
      processing.schedule();
      processing.clearEvents();
      processing.process();
      expect(processing.domainEvents[0]).toBeInstanceOf(ExpenseProcessing);

      const failed = makeExpense();
      failed.approve('approver-person-id');
      failed.schedule();
      failed.clearEvents();
      failed.fail('SCD timeout');
      expect(failed.domainEvents[0]).toBeInstanceOf(ExpenseFailed);
      expect((failed.domainEvents[0] as ExpenseFailed).failureReason).toBe(
        'SCD timeout',
      );

      const paid = makeExpense();
      paid.approve('approver-person-id');
      paid.clearEvents();
      paid.markAsPaid();
      expect(paid.domainEvents[0]).toBeInstanceOf(ExpensePaid);

      paid.clearEvents();
      paid.refund();
      expect(paid.domainEvents[0]).toBeInstanceOf(ExpenseRefunded);

      const cancelled = makeExpense();
      cancelled.clearEvents();
      cancelled.cancel();
      expect(cancelled.domainEvents[0]).toBeInstanceOf(ExpenseCancelled);
      expect(
        (cancelled.domainEvents[0] as ExpenseCancelled).previousStatus,
      ).toBe(ExpenseStatus.DRAFT);
    });
  });
});
