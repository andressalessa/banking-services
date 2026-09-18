import { DomainEvents } from '@/core/events/domain-events';
import { EventHandler } from '@/core/events/event-handler';
import { logDomainEventHandlerFailure } from '@/core/events/log-domain-event-handler-failure';
import { ExpenseFailed } from '@/modules/payment/domain/events/expense-failed.event';
import { ReleaseAccountBalanceUseCase } from '@/modules/account/application/use-cases/release-account-balance.use-case';

export class OnExpenseFailed implements EventHandler {
  constructor(
    private readonly releaseAccountBalance: ReleaseAccountBalanceUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => this.execute(event as ExpenseFailed),
      ExpenseFailed.name,
    );
  }

  private async execute(event: ExpenseFailed): Promise<void> {
    const result = await this.releaseAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-failed:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseFailed.name,
        `Failed to release reserved balance for failed expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }
}
