import { DomainEvents } from '@/core/events/domain-events';
import { EventHandler } from '@/core/events/event-handler';
import { logDomainEventHandlerFailure } from '@/core/events/log-domain-event-handler-failure';
import { ExpenseScheduled } from '@/modules/payment/domain/events/expense-scheduled.event';
import { ReserveAccountBalanceUseCase } from '@/modules/account/application/use-cases/reserve-account-balance.use-case';

export class OnExpenseScheduled implements EventHandler {
  constructor(
    private readonly reserveAccountBalance: ReserveAccountBalanceUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => this.execute(event as ExpenseScheduled),
      ExpenseScheduled.name,
    );
  }

  private async execute(event: ExpenseScheduled): Promise<void> {
    const result = await this.reserveAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseScheduled.name,
        `Failed to reserve balance for expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }
}
