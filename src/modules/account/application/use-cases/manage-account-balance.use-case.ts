import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { DigitalAccount } from '../../domain/entities/digital-account';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { InsufficientBalanceError } from '../../domain/errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../../domain/errors/invalid-account-status-error';
import { DigitalAccountRepository } from '../repositories/digital-account-repository';
import { AccountBalanceOperationRequest } from './account-balance-operation.request';

type BalanceOperationResponse = Either<
  AccountNotFoundError | InsufficientBalanceError | InvalidAccountStatusError,
  void
>;

type CreditOperationResponse = Either<
  AccountNotFoundError | InvalidAccountStatusError,
  void
>;

/**
 * Unified Use Case for all Account Balance operations
 *
 * Consolidates balance management operations to avoid file proliferation:
 * - reserveBalance: Reserve balance for future debit (expense scheduled)
 * - confirmDebit: Confirm debit from reserved balance (expense paid)
 * - releaseBalance: Release reserved balance (expense failed/cancelled)
 * - creditBalance: Credit balance back (expense refunded)
 *
 * All operations follow the same pattern:
 * 1. Find account by ID
 * 2. Execute domain operation
 * 3. Save account
 * 4. Dispatch domain events
 */
export class ManageAccountBalanceUseCase {
  constructor(private readonly accounts: DigitalAccountRepository) {}

  /**
   * Reserve balance for future debit
   * Used when expense is scheduled
   */
  async reserveBalance(
    request: AccountBalanceOperationRequest,
  ): Promise<BalanceOperationResponse> {
    return this.executeBalanceOperation(
      request,
      (account, amount, reason) => account.reserveBalance(amount, reason),
      [InsufficientBalanceError, InvalidAccountStatusError],
    );
  }

  /**
   * Confirm debit from reserved balance
   * Used when expense is paid
   */
  async confirmDebit(
    request: AccountBalanceOperationRequest,
  ): Promise<BalanceOperationResponse> {
    return this.executeBalanceOperation(
      request,
      (account, amount, reason) => account.confirmDebit(amount, reason),
      [InsufficientBalanceError, InvalidAccountStatusError],
    );
  }

  /**
   * Release reserved balance
   * Used when expense fails or is cancelled
   */
  async releaseBalance(
    request: AccountBalanceOperationRequest,
  ): Promise<BalanceOperationResponse> {
    return this.executeBalanceOperation(
      request,
      (account, amount, reason) =>
        account.releaseReservedBalance(amount, reason),
      [InsufficientBalanceError, InvalidAccountStatusError],
    );
  }

  /**
   * Credit balance back
   * Used when expense is refunded
   */
  async creditBalance(
    request: AccountBalanceOperationRequest,
  ): Promise<CreditOperationResponse> {
    return this.executeBalanceOperation(
      request,
      (account, amount, reason) => account.creditBalance(amount, reason),
      [InvalidAccountStatusError],
    ) as Promise<CreditOperationResponse>;
  }

  /**
   * Private helper to execute balance operations with common pattern
   * Reduces code duplication across all balance operations
   */
  private async executeBalanceOperation<E extends Error>(
    request: AccountBalanceOperationRequest,
    operation: (account: DigitalAccount, amount: Money, reason: string) => void,
    expectedErrors: (new (...args: any[]) => E)[],
  ): Promise<Either<AccountNotFoundError | E, void>> {
    const account = await this.accounts.findById(
      new UniqueEntityID(request.accountId),
    );

    if (!account) {
      return left(new AccountNotFoundError());
    }

    try {
      operation(
        account,
        Money.fromCents(request.amountInCents),
        request.reason,
      );
    } catch (error) {
      // Check if error is one of the expected domain errors
      for (const ErrorType of expectedErrors) {
        if (error instanceof ErrorType) {
          return left(error as E);
        }
      }

      // Re-throw unexpected errors
      throw error;
    }

    await this.accounts.save(account);
    await DomainEvents.dispatchEventsForAggregate(account.id);

    return right(undefined);
  }
}
