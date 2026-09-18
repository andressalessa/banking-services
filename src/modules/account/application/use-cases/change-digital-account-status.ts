import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { AccountStatus } from '../../domain/enums/account-status';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { InvalidAccountStatusError } from '../../domain/errors/invalid-account-status-error';
import { DigitalAccountRepository } from '../repositories/digital-account-repository';

interface ChangeDigitalAccountStatusRequest {
  accountId: string;
  newStatus: AccountStatus;
}

type ChangeDigitalAccountStatusResponse = Either<
  AccountNotFoundError | InvalidAccountStatusError,
  void
>;

export class ChangeDigitalAccountStatusUseCase {
  constructor(
    private readonly digitalAccountRepository: DigitalAccountRepository,
  ) {}

  async execute({
    accountId,
    newStatus,
  }: ChangeDigitalAccountStatusRequest): Promise<ChangeDigitalAccountStatusResponse> {
    const account = await this.digitalAccountRepository.findById(
      new UniqueEntityID(accountId),
    );

    if (!account) {
      return left(new AccountNotFoundError());
    }

    try {
      account.changeStatus(newStatus);
    } catch (error) {
      if (error instanceof InvalidAccountStatusError) {
        return left(error);
      }
      throw error;
    }

    await this.digitalAccountRepository.save(account);
    await DomainEvents.dispatchEventsForAggregate(account.id);

    return right(undefined);
  }
}
