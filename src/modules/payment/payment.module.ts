import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { OnExpenseCancelled } from './application/subscribers/on-expense-cancelled.subscriber';
import { OnExpenseFailed } from './application/subscribers/on-expense-failed.subscriber';
import { OnExpensePaid } from './application/subscribers/on-expense-paid.subscriber';
import { OnExpenseRefunded } from './application/subscribers/on-expense-refunded.subscriber';
import { OnExpenseScheduled } from './application/subscribers/on-expense-scheduled.subscriber';

@Module({
  imports: [AccountModule],
  providers: [
    OnExpenseScheduled,
    OnExpensePaid,
    OnExpenseCancelled,
    OnExpenseFailed,
    OnExpenseRefunded,
  ],
})
export class PaymentModule {}
