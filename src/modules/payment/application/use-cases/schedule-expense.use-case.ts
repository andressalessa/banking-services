import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Expense } from '../../domain/entities/expense';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseRepository } from '../repositories/expense-repository';
import { AccountBalancePort } from '../ports/account-balance.port';
import { AccountNotFoundError } from '../../../account/domain/errors/account-not-found-error';
import { InsufficientBalanceError } from '../../../account/domain/errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../../../account/domain/errors/invalid-account-status-error';

interface ScheduleExpenseRequest {
  expenseId: string;
}

type ScheduleExpenseResponse = Either<
  | ExpenseNotFoundError
  | AccountNotFoundError
  | InsufficientBalanceError
  | InvalidAccountStatusError
  | Error,
  void
>;

/**
 * Schedule Expense Use Case
 *
 * Critical operation that:
 * 1. Reserves balance in Account (synchronous via Port)
 * 2. Schedules the expense ONLY if balance reservation succeeds
 *
 * Uses AccountBalancePort for synchronous communication with Account context
 * to ensure balance is available before scheduling.
 */
export class ScheduleExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly accountBalance: AccountBalancePort,
  ) {}

  async execute(
    request: ScheduleExpenseRequest,
  ): Promise<ScheduleExpenseResponse> {
    // 1. Find expense
    const expense = await this.expenseRepository.findById(
      new UniqueEntityID(request.expenseId),
    );

    if (!expense) {
      return left(new ExpenseNotFoundError());
    }

    // 2. CRITICAL: Reserve balance BEFORE scheduling (synchronous)
    const reserveResult = await this.accountBalance.reserveBalance(
      expense.accountId.toString(),
      expense.amount.amountInCents,
      `expense:${expense.id.toString()}`,
    );

    // 3. If reservation failed, do NOT schedule
    if (reserveResult.isLeft()) {
      return left(reserveResult.value);
    }

    // 4. Only schedule if reservation succeeded
    try {
      expense.schedule();
    } catch (error) {
      // If scheduling fails, release the reserved balance
      await this.accountBalance.releaseBalance(
        expense.accountId.toString(),
        expense.amount.amountInCents,
        `expense-schedule-failed:${expense.id.toString()}`,
      );

      if (error instanceof Error) {
        return left(error);
      }
      throw error;
    }

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right(undefined);
  }
}
