import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DigitalAccount } from '../../domain/entities/digital-account';

export abstract class DigitalAccountRepository {
  abstract create(account: DigitalAccount): Promise<void>;
  abstract findById(id: UniqueEntityID): Promise<DigitalAccount | null>;
  abstract save(account: DigitalAccount): Promise<void>;
}
