import { Member as PrismaMember, Prisma } from '@prisma/client';
import { Either } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CPF } from '@/core/value-objects/cpf';
import { Email } from '@/core/value-objects/email';
import { Phone } from '@/core/value-objects/phone';
import {
  Member,
  MemberRole,
  MemberStatus,
} from '@/modules/account/domain/entities/member';

function unwrapOrThrow<E extends { message?: string }, T>(
  result: Either<E, T>,
  context: string,
): T {
  if (result.isLeft()) {
    throw new Error(
      `Invalid ${context} in database: ${result.value.message ?? String(result.value)}`,
    );
  }

  return result.value;
}

export class PrismaMemberMapper {
  static toDomain(raw: PrismaMember): Member {
    const cpf = raw.cpf
      ? unwrapOrThrow(CPF.create(raw.cpf), 'member CPF')
      : undefined;
    const email = raw.email
      ? unwrapOrThrow(Email.create(raw.email), 'member email')
      : undefined;
    const phone = raw.phone
      ? unwrapOrThrow(Phone.create(raw.phone), 'member phone')
      : undefined;

    return Member.create(
      {
        personId: new UniqueEntityID(raw.person_id),
        fullName: raw.full_name ?? undefined,
        cpf,
        email,
        phone,
        role: raw.role as MemberRole,
        status: raw.status as MemberStatus,
        createdAt: raw.created_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    member: Member,
    accountId: UniqueEntityID,
  ): Prisma.MemberUncheckedCreateInput {
    return {
      id: member.id.toString(),
      account_id: accountId.toString(),
      person_id: member.personId.toString(),
      full_name: member.fullName ?? null,
      cpf: member.cpf?.value ?? null,
      email: member.email?.value ?? null,
      phone: member.phone?.value ?? null,
      role: member.role,
      status: member.status,
      created_at: member.createdAt,
    };
  }
}
