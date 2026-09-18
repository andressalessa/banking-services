import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Expense } from '../../domain/entities/expense';
import { ExpenseStatus } from '../../domain/enums/expense-status';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseRepository } from '../repositories/expense-repository';
import { AccountBalancePort } from '../ports/account-balance.port';

interface CancelExpenseRequest {
  expenseId: string;
}

interface RefundExpenseRequest {
  expenseId: string;
}

type CancelExpenseResponse = Either<ExpenseNotFoundError | Error, void>;
type RefundExpenseResponse = Either<ExpenseNotFoundError | Error, void>;

/**
 * Manage Expense Lifecycle Use Case
 *
 * Consolidates lifecycle operations:
 * - cancel: Cancel expense (releases balance if scheduled)
 * - refund: Refund paid expense (credit happens via Domain Event)
 *
 * All operations follow the same pattern:
 * 1. Find expense by ID
 * 2. Execute domain operation
 * 3. Handle side effects (balance operations)
 * 4. Save expense
 * 5. Dispatch domain events
 */
@Injectable()
export class ManageExpenseLifecycleUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly accountBalance: AccountBalancePort,
  ) {}

  /**
   * Cancel expense
   * If expense was SCHEDULED, releases reserved balance
   */
  async cancel(
    request: CancelExpenseRequest,
  ): Promise<CancelExpenseResponse> {
    const expense = await this.expenseRepository.findById(
      new UniqueEntityID(request.expenseId),
    );

    if (!expense) {
      return left(new ExpenseNotFoundError());
    }

    const wasScheduled = expense.status === ExpenseStatus.SCHEDULED;

    try {
      expense.cancel();
    } catch (error) {
      if (error instanceof Error) {
        return left(error);
      }
      throw error;
    }

    // If was scheduled, release reserved balance
    if (wasScheduled) {
      await this.accountBalance.releaseBalance(
        expense.accountId.toString(),
        expense.amount.amountInCents,
        `expense-cancelled:${expense.id.toString()}`,
      );
    }

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right(undefined);
  }

  /**
   * Refund expense
   * Credit happens asynchronously via Domain Event (ExpenseRefunded)
   * Account context will listen and credit the balance
   */
  async refund(
    request: RefundExpenseRequest,
  ): Promise<RefundExpenseResponse> {
    const expense = await this.expenseRepository.findById(
      new UniqueEntityID(request.expenseId),
    );

    if (!expense) {
      return left(new ExpenseNotFoundError());
    }

    try {
      expense.refund();
    } catch (error) {
      if (error instanceof Error) {
        return left(error);
      }
      throw error;
    }

    // DO NOT credit balance here!
    // It will be done asynchronously via Domain Event
    // Account will listen to ExpenseRefunded and credit

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right(undefined);
  }
}
