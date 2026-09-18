import {
  Expense as PrismaExpense,
  ExpenseDecision as PrismaExpenseDecision,
  Prisma,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { bigintToCents } from '@/core/infrastructure/database/bigint-to-cents';
import { Money } from '@/core/value-objects/money';
import { Expense } from '@/modules/payment/domain/entities/expense';
import { ExpenseStatus } from '@/modules/payment/domain/enums/expense-status';
import { PrismaApprovalMapper } from './prisma-approval.mapper';
import { PrismaPayeeMapper } from './prisma-payee.mapper';
import { PrismaPaymentDetailsMapper } from './prisma-payment-details.mapper';

export type PrismaExpenseWithDecisions = PrismaExpense & {
  decisions: PrismaExpenseDecision[];
};

export type PrismaExpensePersistence = {
  expense: Prisma.ExpenseUncheckedCreateInput;
  decisions: Prisma.ExpenseDecisionUncheckedCreateInput[];
};

export class PrismaExpenseMapper {
  static toDomain(raw: PrismaExpenseWithDecisions): Expense {
    return Expense.restore(
      {
        accountId: new UniqueEntityID(raw.account_id),
        payee: PrismaPayeeMapper.toDomain(raw),
        amount: Money.fromCents(bigintToCents(raw.amount_cents)),
        paymentDetails: PrismaPaymentDetailsMapper.toDomain(raw.payment_details),
        approval: PrismaApprovalMapper.toDomain(
          raw.required_approvals_count,
          raw.decisions,
        ),
        status: raw.status as ExpenseStatus,
        dueDate: raw.due_date,
        paidAt: raw.paid_at,
        createdAt: raw.created_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(expense: Expense): PrismaExpensePersistence {
    const payee = PrismaPayeeMapper.toPrisma(expense.payee);

    return {
      expense: {
        id: expense.id.toString(),
        account_id: expense.accountId.toString(),
        payee_name: payee.payee_name,
        payee_tax_id: payee.payee_tax_id,
        payee_tax_id_type: payee.payee_tax_id_type,
        payee_email: payee.payee_email,
        amount_cents: BigInt(expense.amount.amountInCents),
        currency: 'BRL',
        payment_details: PrismaPaymentDetailsMapper.toPrisma(
          expense.paymentDetails,
        ) as unknown as Prisma.InputJsonValue,
        required_approvals_count: expense.approval.requiredApprovalsCount,
        approval_status: expense.approval.status,
        status: expense.status,
        due_date: expense.dueDate,
        paid_at: expense.paidAt,
        created_at: expense.createdAt,
      },
      decisions: PrismaApprovalMapper.decisionsToPrisma(
        expense.id.toString(),
        expense.approval.decisions,
      ).map((decision) => ({
        ...decision,
        id: crypto.randomUUID(),
      })),
    };
  }
}
