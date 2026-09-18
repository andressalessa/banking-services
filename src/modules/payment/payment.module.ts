import { Module } from '@nestjs/common';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { ManageExpenseApprovalUseCase } from './application/use-cases/manage-expense-approval.use-case';
import { ScheduleExpenseUseCase } from './application/use-cases/schedule-expense.use-case';
import { SettleExpenseUseCase } from './application/use-cases/settle-expense.use-case';
import { ManageExpenseLifecycleUseCase } from './application/use-cases/manage-expense-lifecycle.use-case';

// Ports (interfaces)
import { PaymentGatewayPort } from './application/ports/payment-gateway.port';

// Adapters (implementations)
import { ScdPaymentAdapter } from './infrastructure/adapters/scd-payment.adapter';

// Import AccountModule to get AccountBalancePort
import { AccountModule } from '../account/account.module';

@Module({
  imports: [
    AccountModule, // Provides AccountBalancePort
  ],
  providers: [
    // Use Cases
    CreateExpenseUseCase,
    ManageExpenseApprovalUseCase,
    ScheduleExpenseUseCase,
    SettleExpenseUseCase,
    ManageExpenseLifecycleUseCase,

    // Payment Gateway Port implementation (mock for development/testing)
    // To swap payment providers, simply change the useClass here:
    // - ScdPaymentAdapter (current: mock SCD integration)
    // - StripePaymentAdapter (future: Stripe integration)
    // - AdyenPaymentAdapter (future: Adyen integration)
    {
      provide: PaymentGatewayPort,
      useClass: ScdPaymentAdapter,
    },
  ],
  exports: [
    // Use cases exported for tests/other contexts
    CreateExpenseUseCase,
    ManageExpenseApprovalUseCase,
    ScheduleExpenseUseCase,
    SettleExpenseUseCase,
    ManageExpenseLifecycleUseCase,
  ],
})
export class PaymentModule {}
