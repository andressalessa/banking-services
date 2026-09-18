import { DomainEvents } from '@/core/events/domain-events';
import { EventHandler } from '@/core/events/event-handler';
import { logDomainEventHandlerFailure } from '@/core/events/log-domain-event-handler-failure';
import { ExpensePaid } from '@/modules/payment/domain/events/expense-paid.event';
import { ConfirmAccountDebitUseCase } from '@/modules/account/application/use-cases/confirm-account-debit.use-case';

export class OnExpensePaid implements EventHandler {
  constructor(
    private readonly confirmAccountDebit: ConfirmAccountDebitUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => this.execute(event as ExpensePaid),
      ExpensePaid.name,
    );
  }

  private async execute(event: ExpensePaid): Promise<void> {
    const result = await this.confirmAccountDebit.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-paid:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpensePaid.name,
        `Failed to confirm debit for expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }
}
