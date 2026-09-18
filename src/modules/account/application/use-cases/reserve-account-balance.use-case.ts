import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { InsufficientBalanceError } from '../../domain/errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../../domain/errors/invalid-account-status-error';
import { DigitalAccountRepository } from '../repositories/digital-account-repository';
import { AccountBalanceOperationRequest } from './account-balance-operation.request';

type ReserveAccountBalanceResponse = Either<
  AccountNotFoundError | InsufficientBalanceError | InvalidAccountStatusError,
  void
>;

export class ReserveAccountBalanceUseCase {
  constructor(private readonly accounts: DigitalAccountRepository) {}

  async execute(
    request: AccountBalanceOperationRequest,
  ): Promise<ReserveAccountBalanceResponse> {
    const account = await this.accounts.findById(
      new UniqueEntityID(request.accountId),
    );

    if (!account) {
      return left(new AccountNotFoundError());
    }

    try {
      account.reserveBalance(
        Money.fromCents(request.amountInCents),
        request.reason,
      );
    } catch (error) {
      if (
        error instanceof InsufficientBalanceError ||
        error instanceof InvalidAccountStatusError
      ) {
        return left(error);
      }

      throw error;
    }

    await this.accounts.save(account);
    await DomainEvents.dispatchEventsForAggregate(account.id);

    return right(undefined);
  }
}
