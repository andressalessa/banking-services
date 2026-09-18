import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DigitalAccount } from '../../domain/entities/digital-account';
import { DigitalAccountRepository } from '../../application/repositories/digital-account-repository';

export class InMemoryDigitalAccountRepository extends DigitalAccountRepository {
  public items: DigitalAccount[] = [];

  async findById(id: UniqueEntityID): Promise<DigitalAccount | null> {
    return this.items.find((account) => account.id.equals(id)) ?? null;
  }

  async save(account: DigitalAccount): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(account.id));

    if (index >= 0) {
      this.items[index] = account;
      return;
    }

    this.items.push(account);
  }
}
