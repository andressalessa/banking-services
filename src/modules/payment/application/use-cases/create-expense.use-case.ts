import { Either, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Money } from '@/core/value-objects/money';
import { DomainEvents } from '@/core/events/domain-events';
import { Expense } from '../../domain/entities/expense';
import { Payee } from '../../domain/value-objects/payee';
import { PaymentDetails } from '../../domain/value-objects/payment-details';
import { ExpenseRepository } from '../repositories/expense-repository';

interface CreateExpenseRequest {
  accountId: string;
  payee: Payee;
  amount: Money;
  paymentDetails: PaymentDetails;
  dueDate: Date;
}

type CreateExpenseResponse = Either<null, { expense: Expense }>;

export class CreateExpenseUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(
    request: CreateExpenseRequest,
  ): Promise<CreateExpenseResponse> {
    const expense = Expense.create({
      accountId: new UniqueEntityID(request.accountId),
      payee: request.payee,
      amount: request.amount,
      paymentDetails: request.paymentDetails,
      dueDate: request.dueDate,
    });

    await this.expenseRepository.create(expense);
    await DomainEvents.dispatchEventsForAggregate(expense.id);

    return right({ expense });
  }
}
