import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/core/infrastructure/database/prisma.service';
import { DigitalAccountRepository } from '@/modules/account/application/repositories/digital-account-repository';
import { DigitalAccount } from '@/modules/account/domain/entities/digital-account';
import { PrismaAccountMapper } from '../mappers/prisma-account.mapper';

@Injectable()
export class PrismaAccountRepository extends DigitalAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(account: DigitalAccount): Promise<void> {
    const { account: data, members } = PrismaAccountMapper.toPrisma(account);

    await this.prisma.$transaction(async (tx) => {
      await tx.digitalAccount.create({ data });

      if (members.length > 0) {
        await tx.member.createMany({ data: members });
      }
    });
  }

  async findById(id: UniqueEntityID): Promise<DigitalAccount | null> {
    const raw = await this.prisma.digitalAccount.findFirst({
      where: {
        id: id.toString(),
        deleted_at: null,
      },
      include: {
        members: {
          where: { deleted_at: null },
        },
      },
    });

    if (!raw) {
      return null;
    }

    return PrismaAccountMapper.toDomain(raw);
  }

  async save(account: DigitalAccount): Promise<void> {
    const { account: data, members } = PrismaAccountMapper.toPrisma(account);
    const accountId = account.id.toString();

    await this.prisma.$transaction(async (tx) => {
      await tx.digitalAccount.upsert({
        where: { id: accountId },
        create: data,
        update: {
          holder_cnpj: data.holder_cnpj,
          holder_legal_name: data.holder_legal_name,
          holder_trade_name: data.holder_trade_name,
          balance_cents: data.balance_cents,
          reserved_balance_cents: data.reserved_balance_cents,
          currency: data.currency,
          status: data.status,
          bank_code: data.bank_code,
          bank_branch: data.bank_branch,
          bank_account_number: data.bank_account_number,
          external_account_id: data.external_account_id,
          updated_at: new Date(),
        },
      });

      for (const member of members) {
        await tx.member.upsert({
          where: { id: member.id },
          create: member,
          update: {
            person_id: member.person_id,
            full_name: member.full_name,
            cpf: member.cpf,
            email: member.email,
            phone: member.phone,
            role: member.role,
            status: member.status,
          },
        });
      }
    });
  }
}
