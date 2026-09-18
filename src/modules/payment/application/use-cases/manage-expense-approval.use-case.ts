import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Expense } from '../../domain/entities/expense';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseRepository } from '../repositories/expense-repository';

interface ApproveExpenseRequest {
  expenseId: string;
  approverPersonId: string;
}

interface RejectExpenseRequest {
  expenseId: string;
  rejectorPersonId: string;
  reason: string;
}

type ApproveExpenseResponse = Either<ExpenseNotFoundError, void>;
type RejectExpenseResponse = Either<ExpenseNotFoundError | Error, void>;

/**
 * Unified Use Case for Expense Approval operations
 *
 * Consolidates approval/rejection operations to avoid file proliferation:
 * - approve: Add approval decision to expense
 * - reject: Add rejection decision with reason
 *
 * All operations follow the same pattern:
 * 1. Find expense by ID
 * 2. Execute domain operation
 * 3. Save expense
 * 4. Dispatch domain events
 */
export class ManageExpenseApprovalUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  /**
   * Approve expense
   * Adds approval decision from approver
   */
  async approve(
    request: ApproveExpenseRequest,
  ): Promise<ApproveExpenseResponse> {
    const expense = await this.expenseRepository.findById(
      new UniqueEntityID(request.expenseId),
    );

    if (!expense) {
      return left(new ExpenseNotFoundError());
    }

    expense.approve(request.approverPersonId);

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right(undefined);
  }

  /**
   * Reject expense
   * Adds rejection decision with reason
   */
  async reject(
    request: RejectExpenseRequest,
  ): Promise<RejectExpenseResponse> {
    const expense = await this.expenseRepository.findById(
      new UniqueEntityID(request.expenseId),
    );

    if (!expense) {
      return left(new ExpenseNotFoundError());
    }

    try {
      expense.reject(request.rejectorPersonId, request.reason);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        return left(error);
      }
      throw error;
    }

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right(undefined);
  }
}
