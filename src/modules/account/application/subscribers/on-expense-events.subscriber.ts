import { DomainEvents } from '@/core/events/domain-events';
import { EventHandler } from '@/core/events/event-handler';
import { logDomainEventHandlerFailure } from '@/core/events/log-domain-event-handler-failure';

// Import all Expense events from Payment context (Published Language)
import { ExpenseScheduled } from '@/modules/payment/domain/events/expense-scheduled.event';
import { ExpensePaid } from '@/modules/payment/domain/events/expense-paid.event';
import { ExpenseFailed } from '@/modules/payment/domain/events/expense-failed.event';
import { ExpenseCancelled } from '@/modules/payment/domain/events/expense-cancelled.event';
import { ExpenseRefunded } from '@/modules/payment/domain/events/expense-refunded.event';
import { ExpenseStatus } from '@/modules/payment/domain/enums/expense-status';

// Import Account use cases (same context)
import { ReserveAccountBalanceUseCase } from '../use-cases/reserve-account-balance.use-case';
import { ConfirmAccountDebitUseCase } from '../use-cases/confirm-account-debit.use-case';
import { ReleaseAccountBalanceUseCase } from '../use-cases/release-account-balance.use-case';
import { CreditAccountBalanceUseCase } from '../use-cases/credit-account-balance.use-case';

/**
 * Unified Event Subscriber for all Expense lifecycle events
 * Account Context reacts to Payment Context events
 *
 * This subscriber consolidates balance management operations triggered by expense state changes:
 * - ExpenseScheduled → Reserve balance
 * - ExpensePaid → Confirm debit
 * - ExpenseFailed → Release reserved balance
 * - ExpenseCancelled → Release reserved balance (conditional)
 * - ExpenseRefunded → Credit balance back
 */
export class OnExpenseEvents implements EventHandler {
  constructor(
    private readonly reserveAccountBalance: ReserveAccountBalanceUseCase,
    private readonly confirmAccountDebit: ConfirmAccountDebitUseCase,
    private readonly releaseAccountBalance: ReleaseAccountBalanceUseCase,
    private readonly creditAccountBalance: CreditAccountBalanceUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => this.handleExpenseScheduled(event as ExpenseScheduled),
      ExpenseScheduled.name,
    );

    DomainEvents.register(
      (event) => this.handleExpensePaid(event as ExpensePaid),
      ExpensePaid.name,
    );

    DomainEvents.register(
      (event) => this.handleExpenseFailed(event as ExpenseFailed),
      ExpenseFailed.name,
    );

    DomainEvents.register(
      (event) => this.handleExpenseCancelled(event as ExpenseCancelled),
      ExpenseCancelled.name,
    );

    DomainEvents.register(
      (event) => this.handleExpenseRefunded(event as ExpenseRefunded),
      ExpenseRefunded.name,
    );
  }

  /**
   * When expense is scheduled → Reserve balance
   */
  private async handleExpenseScheduled(event: ExpenseScheduled): Promise<void> {
    const result = await this.reserveAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseEvents.name,
        `Failed to reserve balance for expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }

  /**
   * When expense is paid → Confirm debit
   */
  private async handleExpensePaid(event: ExpensePaid): Promise<void> {
    const result = await this.confirmAccountDebit.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-paid:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseEvents.name,
        `Failed to confirm debit for expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }

  /**
   * When expense fails → Release reserved balance
   */
  private async handleExpenseFailed(event: ExpenseFailed): Promise<void> {
    const result = await this.releaseAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-failed:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseEvents.name,
        `Failed to release reserved balance for failed expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }

  /**
   * When expense is cancelled → Release reserved balance (if was scheduled/processing)
   */
  private async handleExpenseCancelled(
    event: ExpenseCancelled,
  ): Promise<void> {
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
        OnExpenseEvents.name,
        `Failed to release reserved balance for cancelled expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }

  /**
   * When expense is refunded → Credit balance back
   */
  private async handleExpenseRefunded(event: ExpenseRefunded): Promise<void> {
    const result = await this.creditAccountBalance.execute({
      accountId: event.accountId,
      amountInCents: event.amount.valueInCents,
      reason: `expense-refunded:${event.expenseId}`,
    });

    if (result.isLeft()) {
      logDomainEventHandlerFailure(
        OnExpenseEvents.name,
        `Failed to credit balance for refunded expense ${event.expenseId}: ${result.value.message}`,
      );
    }
  }
}
