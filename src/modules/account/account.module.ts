import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/core/infrastructure/database/database.module';
import { ManageAccountBalanceUseCase } from './application/use-cases/manage-account-balance.use-case';
import { ChangeDigitalAccountStatusUseCase } from './application/use-cases/change-digital-account-status';
import { ManageAccountMembersUseCase } from './application/use-cases/manage-account-members.use-case';
import { CreateDigitalAccountUseCase } from './application/use-cases/create-digital-account';
import { DigitalAccountRepository } from './application/repositories/digital-account-repository';
import { PrismaAccountRepository } from './infrastructure/repositories/prisma-account.repository';

import { OnExpenseEvents } from './application/subscribers/on-expense-events.subscriber';

import { AccountBalanceAdapter } from './infrastructure/adapters/account-balance.adapter';
import { AccountBalancePort } from '../payment/application/ports/account-balance.port';

@Module({
  imports: [DatabaseModule],
  providers: [
    CreateDigitalAccountUseCase,
    ChangeDigitalAccountStatusUseCase,
    ManageAccountBalanceUseCase,
    ManageAccountMembersUseCase,

    OnExpenseEvents,

    {
      provide: DigitalAccountRepository,
      useClass: PrismaAccountRepository,
    },

    {
      provide: AccountBalancePort,
      useClass: AccountBalanceAdapter,
    },
  ],
  exports: [
    CreateDigitalAccountUseCase,
    ChangeDigitalAccountStatusUseCase,
    ManageAccountBalanceUseCase,
    ManageAccountMembersUseCase,
    AccountBalancePort,
  ],
})
export class AccountModule {}
