import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/core/infrastructure/database/database.module';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { ManageExpenseApprovalUseCase } from './application/use-cases/manage-expense-approval.use-case';
import { ScheduleExpenseUseCase } from './application/use-cases/schedule-expense.use-case';
import { SettleExpenseUseCase } from './application/use-cases/settle-expense.use-case';
import { ManageExpenseLifecycleUseCase } from './application/use-cases/manage-expense-lifecycle.use-case';
import { ExpenseRepository } from './application/repositories/expense-repository';
import { PrismaExpenseRepository } from './infrastructure/repositories/prisma-expense.repository';

import { PaymentGatewayPort } from './application/ports/payment-gateway.port';
import { ScdPaymentAdapter } from './infrastructure/adapters/scd-payment.adapter';

import { AccountModule } from '../account/account.module';

@Module({
  imports: [DatabaseModule, AccountModule],
  providers: [
    CreateExpenseUseCase,
    ManageExpenseApprovalUseCase,
    ScheduleExpenseUseCase,
    SettleExpenseUseCase,
    ManageExpenseLifecycleUseCase,

    {
      provide: ExpenseRepository,
      useClass: PrismaExpenseRepository,
    },

    {
      provide: PaymentGatewayPort,
      useClass: ScdPaymentAdapter,
    },
  ],
  exports: [
    CreateExpenseUseCase,
    ManageExpenseApprovalUseCase,
    ScheduleExpenseUseCase,
    SettleExpenseUseCase,
    ManageExpenseLifecycleUseCase,
  ],
})
export class PaymentModule {}
