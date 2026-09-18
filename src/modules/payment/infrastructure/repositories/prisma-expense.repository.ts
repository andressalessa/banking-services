import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/core/infrastructure/database/prisma.service';
import { ExpenseRepository } from '@/modules/payment/application/repositories/expense-repository';
import { Expense } from '@/modules/payment/domain/entities/expense';
import { PrismaExpenseMapper } from '../mappers/prisma-expense.mapper';

@Injectable()
export class PrismaExpenseRepository extends ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(expense: Expense): Promise<void> {
    const { expense: data, decisions } = PrismaExpenseMapper.toPrisma(expense);

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.create({ data });

      if (decisions.length > 0) {
        await tx.expenseDecision.createMany({ data: decisions });
      }
    });
  }

  async findById(id: UniqueEntityID): Promise<Expense | null> {
    const raw = await this.prisma.expense.findFirst({
      where: {
        id: id.toString(),
        deleted_at: null,
      },
      include: {
        decisions: true,
      },
    });

    if (!raw) {
      return null;
    }

    return PrismaExpenseMapper.toDomain(raw);
  }

  async findByAccountId(accountId: UniqueEntityID): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        account_id: accountId.toString(),
        deleted_at: null,
      },
      include: {
        decisions: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return expenses.map(PrismaExpenseMapper.toDomain);
  }

  async save(expense: Expense): Promise<void> {
    const { expense: data, decisions } = PrismaExpenseMapper.toPrisma(expense);
    const expenseId = expense.id.toString();

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.upsert({
        where: { id: expenseId },
        create: data,
        update: {
          payee_name: data.payee_name,
          payee_tax_id: data.payee_tax_id,
          payee_tax_id_type: data.payee_tax_id_type,
          payee_email: data.payee_email,
          amount_cents: data.amount_cents,
          currency: data.currency,
          payment_details: data.payment_details,
          required_approvals_count: data.required_approvals_count,
          approval_status: data.approval_status,
          status: data.status,
          due_date: data.due_date,
          paid_at: data.paid_at,
        },
      });

      for (const decision of decisions) {
        await tx.expenseDecision.upsert({
          where: {
            expense_id_approver_person_id: {
              expense_id: expenseId,
              approver_person_id: decision.approver_person_id,
            },
          },
          create: decision,
          update: {
            decision_status: decision.decision_status,
            rejection_reason: decision.rejection_reason,
          },
        });
      }
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await this.prisma.expense.update({
      where: { id: id.toString() },
      data: { deleted_at: new Date() },
    });
  }
}
