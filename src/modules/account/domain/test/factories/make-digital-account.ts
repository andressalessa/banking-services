import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Money } from '@/core/value-objects/money';
import { DigitalAccount } from '../../entities/digital-account';
import { AccountStatus } from '../../enums/account-status';
import { BankIdentity } from '../../value-objects/bank-identity';
import { makeAccountHolder } from './make-account-holder';
import { makeMember } from './make-member';

interface MakeDigitalAccountProps {
  holder?: ReturnType<typeof makeAccountHolder>;
  bankIdentity?: BankIdentity;
  members?: ReturnType<typeof makeMember>[];
  status?: AccountStatus;
  balance?: Money;
  reservedBalance?: Money;
  id?: UniqueEntityID;
}

export function makeDigitalAccount(
  override: MakeDigitalAccountProps = {},
): DigitalAccount {
  return DigitalAccount.create(
    {
      holder: override.holder ?? makeAccountHolder(),
      bankIdentity:
        override.bankIdentity ??
        BankIdentity.create({
          externalAccountId: 'external-account-1',
          bankCode: '001',
          branch: '0001',
          accountNumber: '123456-7',
        }),
      members: override.members ?? [makeMember()],
      status: override.status ?? AccountStatus.ACTIVE,
      balance: override.balance ?? Money.create(1000),
      reservedBalance: override.reservedBalance ?? Money.create(0),
    },
    override.id,
  );
}
