import {
  DigitalAccount as PrismaDigitalAccount,
  Member as PrismaMember,
  Prisma,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { bigintToCents } from '@/core/infrastructure/database/bigint-to-cents';
import { Money } from '@/core/value-objects/money';
import { DigitalAccount } from '@/modules/account/domain/entities/digital-account';
import { AccountStatus } from '@/modules/account/domain/enums/account-status';
import { AccountHolder } from '@/modules/account/domain/value-objects/account-holder';
import { BankIdentity } from '@/modules/account/domain/value-objects/bank-identity';
import { PrismaMemberMapper } from './prisma-member.mapper';

export type PrismaAccountWithMembers = PrismaDigitalAccount & {
  members: PrismaMember[];
};

export type PrismaAccountPersistence = {
  account: Prisma.DigitalAccountUncheckedCreateInput;
  members: Prisma.MemberUncheckedCreateInput[];
};

export class PrismaAccountMapper {
  static toDomain(raw: PrismaAccountWithMembers): DigitalAccount {
    return DigitalAccount.restore(
      {
        holder: AccountHolder.create({
          cnpj: raw.holder_cnpj,
          legalName: raw.holder_legal_name,
          tradeName: raw.holder_trade_name,
        }),
        bankIdentity: BankIdentity.create({
          externalAccountId: raw.external_account_id,
          bankCode: raw.bank_code,
          branch: raw.bank_branch,
          accountNumber: raw.bank_account_number,
        }),
        status: raw.status as AccountStatus,
        balance: Money.fromCents(bigintToCents(raw.balance_cents)),
        reservedBalance: Money.fromCents(
          bigintToCents(raw.reserved_balance_cents),
        ),
        members: raw.members.map(PrismaMemberMapper.toDomain),
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(account: DigitalAccount): PrismaAccountPersistence {
    return {
      account: {
        id: account.id.toString(),
        holder_cnpj: account.holder.cnpj,
        holder_legal_name: account.holder.legalName,
        holder_trade_name: account.holder.tradeName,
        balance_cents: BigInt(account.balance.amountInCents),
        reserved_balance_cents: BigInt(account.reservedBalance.amountInCents),
        currency: 'BRL',
        status: account.status,
        bank_code: account.bankIdentity.bankCode,
        bank_branch: account.bankIdentity.branch,
        bank_account_number: account.bankIdentity.accountNumber,
        external_account_id: account.bankIdentity.externalAccountId,
        created_at: account.createdAt,
        updated_at: account.updatedAt ?? undefined,
      },
      members: account.members.map((member) =>
        PrismaMemberMapper.toPrisma(member, account.id),
      ),
    };
  }
}
