import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Money } from '@/core/value-objects/money';
import { Expense } from '../../entities/expense';
import { ExpenseStatus } from '../../enums/expense-status';
import { Approval } from '../../value-objects/approval';
import { makePayee } from './make-payee';
import { makePaymentDetails } from './make-payment-details';

interface MakeExpenseProps {
  accountId?: UniqueEntityID;
  payee?: ReturnType<typeof makePayee>;
  amount?: Money;
  paymentDetails?: ReturnType<typeof makePaymentDetails>;
  dueDate?: Date;
  approval?: Approval;
  status?: ExpenseStatus;
  id?: UniqueEntityID;
}

export function makeExpense(override: MakeExpenseProps = {}): Expense {
  return Expense.create(
    {
      accountId: override.accountId ?? new UniqueEntityID('account-1'),
      payee: override.payee ?? makePayee(),
      amount: override.amount ?? Money.create(500),
      paymentDetails: override.paymentDetails ?? makePaymentDetails(),
      dueDate: override.dueDate ?? new Date('2026-12-31'),
      approval: override.approval,
      status: override.status,
    },
    override.id,
  );
}
