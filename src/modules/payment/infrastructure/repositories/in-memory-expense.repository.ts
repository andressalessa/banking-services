import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Expense } from '../../domain/entities/expense';
import { ExpenseRepository } from '../../application/repositories/expense-repository';

export class InMemoryExpenseRepository extends ExpenseRepository {
  public items: Expense[] = [];

  async findById(id: UniqueEntityID): Promise<Expense | null> {
    return this.items.find((expense) => expense.id.equals(id)) ?? null;
  }

  async create(expense: Expense): Promise<void> {
    this.items.push(expense);
  }

  async save(expense: Expense): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(expense.id));

    if (index >= 0) {
      this.items[index] = expense;
      return;
    }

    this.items.push(expense);
  }
}
