import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Expense } from '../../domain/entities/expense';

export abstract class ExpenseRepository {
  abstract create(expense: Expense): Promise<void>;
  abstract findById(id: UniqueEntityID): Promise<Expense | null>;
  abstract save(expense: Expense): Promise<void>;
}
