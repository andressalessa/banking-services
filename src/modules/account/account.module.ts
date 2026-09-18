import { Module } from '@nestjs/common';
import { ManageAccountBalanceUseCase } from './application/use-cases/manage-account-balance.use-case';
import { ChangeDigitalAccountStatusUseCase } from './application/use-cases/change-digital-account-status';
import { ManageAccountMembersUseCase } from './application/use-cases/manage-account-members.use-case';
import { CreateDigitalAccountUseCase } from './application/use-cases/create-digital-account';

// Unified Subscriber reacting to Payment events
import { OnExpenseEvents } from './application/subscribers/on-expense-events.subscriber';

@Module({
  providers: [
    // Use Cases
    CreateDigitalAccountUseCase,
    ChangeDigitalAccountStatusUseCase,
    ManageAccountBalanceUseCase,
    ManageAccountMembersUseCase,

    // Event Subscriber (Account reacts to Payment)
    OnExpenseEvents,
  ],
  exports: [
    // Use cases exported for tests/other contexts
    CreateDigitalAccountUseCase,
    ChangeDigitalAccountStatusUseCase,
    ManageAccountBalanceUseCase,
    ManageAccountMembersUseCase,
  ],
})
export class AccountModule {}
