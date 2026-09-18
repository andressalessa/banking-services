import { Either } from '@/core/either';
import { AccountNotFoundError } from '../../../account/domain/errors/account-not-found-error';
import { InsufficientBalanceError } from '../../../account/domain/errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../../../account/domain/errors/invalid-account-status-error';

export abstract class AccountBalancePort {
  abstract reserveBalance(
    accountId: string,
    amountInCents: number,
    reason: string,
  ): Promise<
    Either<
      | AccountNotFoundError
      | InsufficientBalanceError
      | InvalidAccountStatusError,
      void
    >
  >;

  abstract releaseBalance(
    accountId: string,
    amountInCents: number,
    reason: string,
  ): Promise<
    Either<
      | AccountNotFoundError
      | InsufficientBalanceError
      | InvalidAccountStatusError,
      void
    >
  >;

  abstract confirmDebit(
    accountId: string,
    amountInCents: number,
    reason: string,
  ): Promise<
    Either<
      | AccountNotFoundError
      | InsufficientBalanceError
      | InvalidAccountStatusError,
      void
    >
  >;
}
