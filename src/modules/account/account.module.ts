import { Module } from '@nestjs/common';
import { ManageAccountBalanceUseCase } from './application/use-cases/manage-account-balance.use-case';
import { ChangeDigitalAccountStatusUseCase } from './application/use-cases/change-digital-account-status';
import { ManageAccountMembersUseCase } from './application/use-cases/manage-account-members.use-case';
import { CreateDigitalAccountUseCase } from './application/use-cases/create-digital-account';

// Unified Subscriber reacting to Payment events
import { OnExpenseEvents } from './application/subscribers/on-expense-events.subscriber';

// Adapter implementing AccountBalancePort for Payment module
import { AccountBalanceAdapter } from './infrastructure/adapters/account-balance.adapter';
import { AccountBalancePort } from '../payment/application/ports/account-balance.port';

@Module({
  providers: [
    // Use Cases
    CreateDigitalAccountUseCase,
    ChangeDigitalAccountStatusUseCase,
    ManageAccountBalanceUseCase,
    ManageAccountMembersUseCase,

    // Event Subscriber (Account reacts to Payment)
    OnExpenseEvents,

    // Port implementation for Payment module integration
    {
      provide: AccountBalancePort,
      useClass: AccountBalanceAdapter,
    },
  ],
  exports: [
    // Use cases exported for tests/other contexts
    CreateDigitalAccountUseCase,
    ChangeDigitalAccountStatusUseCase,
    ManageAccountBalanceUseCase,
    ManageAccountMembersUseCase,

    // Port exported for Payment module to use
    AccountBalancePort,
  ],
})
export class AccountModule {}
