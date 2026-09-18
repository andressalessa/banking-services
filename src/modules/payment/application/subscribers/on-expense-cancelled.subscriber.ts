import { DomainEvents } from '@/core/events/domain-events';
import { EventHandler } from '@/core/events/event-handler';
import { logDomainEventHandlerFailure } from '@/core/events/log-domain-event-handler-failure';
import { ExpenseCancelled } from '@/modules/payment/domain/events/expense-cancelled.event';
import { ReleaseAccountBalanceUseCase } from '@/modules/account/application/use-cases/release-account-balance.use-case';
import { ExpenseStatus } from '../../domain/enums/expense-status';

export class OnExpenseCancelled implements EventHandler {
  constructor(
    private readonly releaseAccountBalance: ReleaseAccountBalanceUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => this.execute(event as ExpenseCancelled),
      ExpenseCancelled.name,
    );
  }

  private async execute(event: ExpenseCancelled): Promise<void> {
    const hadReservedBalance =
      event.previousStatus === ExpenseStatus.SCHEDULED ||
      event.previousStatus === ExpenseStatus.PROCESSING;

    if (!hadReservedBalance) {
      return;
    }

    const result = await this.releaseAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-cancelled:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseCancelled.name,
        `Failed to release reserved balance for cancelled expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }
}
