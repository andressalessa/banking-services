import { DomainEvents } from '@/core/events/domain-events';
import { EventHandler } from '@/core/events/event-handler';
import { logDomainEventHandlerFailure } from '@/core/events/log-domain-event-handler-failure';
import { ExpenseRefunded } from '@/modules/payment/domain/events/expense-refunded.event';
import { CreditAccountBalanceUseCase } from '@/modules/account/application/use-cases/credit-account-balance.use-case';

export class OnExpenseRefunded implements EventHandler {
  constructor(
    private readonly creditAccountBalance: CreditAccountBalanceUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => this.execute(event as ExpenseRefunded),
      ExpenseRefunded.name,
    );
  }

  private async execute(event: ExpenseRefunded): Promise<void> {
    const result = await this.creditAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-refunded:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseRefunded.name,
        `Failed to credit balance for refunded expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }
}
