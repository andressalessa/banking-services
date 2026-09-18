import { Module } from '@nestjs/common';
import { ConfirmAccountDebitUseCase } from './application/use-cases/confirm-account-debit.use-case';
import { CreditAccountBalanceUseCase } from './application/use-cases/credit-account-balance.use-case';
import { ReleaseAccountBalanceUseCase } from './application/use-cases/release-account-balance.use-case';
import { ReserveAccountBalanceUseCase } from './application/use-cases/reserve-account-balance.use-case';

@Module({
  providers: [
    ReserveAccountBalanceUseCase,
    ReleaseAccountBalanceUseCase,
    ConfirmAccountDebitUseCase,
    CreditAccountBalanceUseCase,
  ],
  exports: [
    ReserveAccountBalanceUseCase,
    ReleaseAccountBalanceUseCase,
    ConfirmAccountDebitUseCase,
    CreditAccountBalanceUseCase,
  ],
})
export class AccountModule {}
