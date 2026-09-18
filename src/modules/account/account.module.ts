import { Module } from '@nestjs/common';
import { ConfirmAccountDebitUseCase } from './application/use-cases/confirm-account-debit.use-case';
import { CreditAccountBalanceUseCase } from './application/use-cases/credit-account-balance.use-case';
import { ReleaseAccountBalanceUseCase } from './application/use-cases/release-account-balance.use-case';
import { ReserveAccountBalanceUseCase } from './application/use-cases/reserve-account-balance.use-case';

// Unified Subscriber reacting to Payment events
import { OnExpenseEvents } from './application/subscribers/on-expense-events.subscriber';

@Module({
  providers: [
    // Use Cases
    ReserveAccountBalanceUseCase,
    ReleaseAccountBalanceUseCase,
    ConfirmAccountDebitUseCase,
    CreditAccountBalanceUseCase,

    // Event Subscriber (Account reacts to Payment)
    OnExpenseEvents,
  ],
  exports: [
    // Only use cases are exported (for tests/other contexts)
    ReserveAccountBalanceUseCase,
    ReleaseAccountBalanceUseCase,
    ConfirmAccountDebitUseCase,
    CreditAccountBalanceUseCase,
  ],
})
export class AccountModule {}
