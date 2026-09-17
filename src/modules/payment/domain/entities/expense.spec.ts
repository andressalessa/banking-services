import { Money } from '@/core/value-objects/money';
import { Expense } from '../entities/expense';
import { Payee } from '../value-objects/payee';
import { PaymentDetails } from '../value-objects/payment-details';
import { ExpenseIsNotApprovedError } from '../errors/expense-is-not-approved';

describe('Expense Aggregate Root', () => {
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

  it('should create an expense with DRAFT status by default', () => {
    const expense = Expense.create({
      accountId: 'account-1',
      payee: makePayee(),
      amount: Money.create(500),
      paymentDetails: makePaymentDetails(),
      dueDate: new Date(),
    });

    expect(expense.status).toBe('DRAFT');
    expect(expense.approval.status).toBe('PENDING');
  });

  it('should approve an expense and allow payment', () => {
    const expense = Expense.create({
      accountId: 'account-1',
      payee: makePayee(),
      amount: Money.create(500),
      paymentDetails: makePaymentDetails(),
      dueDate: new Date(),
    });

    expense.approve('approver-person-id');
    expect(expense.approval.status).toBe('APPROVED');

    expense.markAsPaid();
    expect(expense.status).toBe('PAID');
    expect(expense.paidAt).toBeDefined();
  });

  it('should throw an error when trying to pay an unapproved expense', () => {
    const expense = Expense.create({
      accountId: 'account-1',
      payee: makePayee(),
      amount: Money.create(500),
      paymentDetails: makePaymentDetails(),
      dueDate: new Date(),
    });

    expect(() => expense.markAsPaid()).toThrow(ExpenseIsNotApprovedError);
  });
});
