import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Expense } from '../../domain/entities/expense';
import { ExpenseNotFoundError } from '../../domain/errors/expense-not-found-error';
import { ExpenseRepository } from '../repositories/expense-repository';
import { AccountBalancePort } from '../ports/account-balance.port';
import { PaymentGatewayPort } from '../ports/payment-gateway.port';

interface SettleExpenseRequest {
  expenseId: string;
}

type SettleExpenseResponse = Either<
  ExpenseNotFoundError | Error,
  { transactionId: string }
>;

/**
 * Settle Expense Use Case
 *
 * Process payment via external payment gateway and mark expense as paid.
 *
 * Steps:
 * 1. Mark expense as PROCESSING
 * 2. Call Payment Gateway (via PaymentGatewayPort)
 * 3. If success: Confirm debit and mark as PAID
 * 4. If failure: Mark as FAILED and release reserved balance
 *
 * Uses both AccountBalancePort and PaymentGatewayPort for synchronous operations.
 * PaymentGatewayPort can be implemented by any payment provider (SCD, Stripe, Adyen, etc).
 */
@Injectable()
export class SettleExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly accountBalance: AccountBalancePort,
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(
    request: SettleExpenseRequest,
  ): Promise<SettleExpenseResponse> {
    const expense = await this.expenseRepository.findById(
      new UniqueEntityID(request.expenseId),
    );

    if (!expense) {
      return left(new ExpenseNotFoundError());
    }

    // 1. Mark as PROCESSING
    try {
      expense.process();
    } catch (error) {
      if (error instanceof Error) {
        return left(error);
      }
      throw error;
    }

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    // 2. Process payment via Payment Gateway (external system)
    const paymentResult = await this.paymentGateway.processPayment({
      expenseId: expense.id.toString(),
      accountId: expense.accountId.toString(),
      amount: expense.amount.amountInCents,
      payee: {
        name: expense.payee.name,
        taxId: expense.payee.taxId,
      },
      paymentDetails: {
        method: expense.paymentDetails.method,
        pixKey: expense.paymentDetails.pixKey,
      },
    });

    // 3. If payment failed in gateway
    if (paymentResult.isLeft()) {
      expense.fail(paymentResult.value.message);
      await this.expenseRepository.save(expense);

      // Release reserved balance
      await this.accountBalance.releaseBalance(
        expense.accountId.toString(),
        expense.amount.amountInCents,
        `expense-failed:${expense.id.toString()}`,
      );

      await DomainEvents.dispatchEventsForAggregate(expense.id);

      return left(paymentResult.value);
    }

    // 4. Payment succeeded: Confirm debit (convert reserved → debited)
    await this.accountBalance.confirmDebit(
      expense.accountId.toString(),
      expense.amount.amountInCents,
      `expense-paid:${expense.id.toString()}`,
    );

    // 5. Mark expense as PAID
    try {
      expense.markAsPaid();
    } catch (error) {
      if (error instanceof Error) {
        return left(error);
      }
      throw error;
    }

    await this.expenseRepository.save(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right({ transactionId: paymentResult.value.transactionId });
  }
}
