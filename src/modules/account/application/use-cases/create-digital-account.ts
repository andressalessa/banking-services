import { Injectable } from '@nestjs/common';
import { AccountHolder } from '../../domain/value-objects/account-holder';
import { BankIdentity } from '../../domain/value-objects/bank-identity';
import { Member } from '../../domain/entities/member';
import { Either, right } from '@/core/either';
import { DigitalAccount } from '../../domain/entities/digital-account';
import { DigitalAccountRepository } from '../repositories/digital-account-repository';

interface CreateDigitalAccountRequest {
  holder: AccountHolder;
  bankIdentity: BankIdentity;
  members: Member[];
}

type CreateDigitalAccountResponse = Either<
  null,
  { digitalAccount: DigitalAccount }
>;

@Injectable()
export class CreateDigitalAccountUseCase {
  constructor(private digitalAccountRepository: DigitalAccountRepository) {}

  async execute({
    holder,
    bankIdentity,
    members,
  }: CreateDigitalAccountRequest): Promise<CreateDigitalAccountResponse> {
    const digitalAccount = DigitalAccount.create({
      holder,
      bankIdentity,
      members,
    });

    await this.digitalAccountRepository.create(digitalAccount);

    return right({ digitalAccount });
  }
}
