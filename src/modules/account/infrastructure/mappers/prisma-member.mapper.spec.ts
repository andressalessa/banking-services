import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CPF } from '@/core/value-objects/cpf';
import { Email } from '@/core/value-objects/email';
import { Phone } from '@/core/value-objects/phone';
import { Member, MemberRole } from '@/modules/account/domain/entities/member';
import { PrismaMemberMapper } from './prisma-member.mapper';

const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440001';
const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000';
const PERSON_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('PrismaMemberMapper', () => {
  const now = new Date('2026-01-10T08:00:00.000Z');

  it('should convert Prisma member to Domain member', () => {
    const member = PrismaMemberMapper.toDomain({
      id: MEMBER_ID,
      account_id: ACCOUNT_ID,
      person_id: PERSON_ID,
      full_name: 'João Silva',
      cpf: '39053344705',
      email: 'joao@example.com',
      phone: '+5511987654321',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    expect(member).toBeInstanceOf(Member);
    expect(member.id.toString()).toBe(MEMBER_ID);
    expect(member.personId.toString()).toBe(PERSON_ID);
    expect(member.fullName).toBe('João Silva');
    expect(member.cpf?.value).toBe('39053344705');
    expect(member.email?.value).toBe('joao@example.com');
    expect(member.phone?.value).toBe('+5511987654321');
    expect(member.role).toBe(MemberRole.ADMIN);
    expect(member.isApprover()).toBe(true);
  });

  it('should convert Domain member to Prisma format', () => {
    const cpf = CPF.create('39053344705');
    const email = Email.create('joao@example.com');
    const phone = Phone.create('+5511987654321');

    const member = Member.create(
      {
        personId: new UniqueEntityID(PERSON_ID),
        fullName: 'João Silva',
        cpf: cpf.isRight() ? cpf.value : undefined,
        email: email.isRight() ? email.value : undefined,
        phone: phone.isRight() ? phone.value : undefined,
        role: MemberRole.ADMIN,
        createdAt: now,
      },
      new UniqueEntityID(MEMBER_ID),
    );

    const raw = PrismaMemberMapper.toPrisma(
      member,
      new UniqueEntityID(ACCOUNT_ID),
    );

    expect(raw).toMatchObject({
      id: MEMBER_ID,
      account_id: ACCOUNT_ID,
      person_id: PERSON_ID,
      full_name: 'João Silva',
      cpf: '39053344705',
      email: 'joao@example.com',
      phone: '+5511987654321',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
  });

  it('should map optional identity fields as null', () => {
    const member = Member.create(
      {
        personId: new UniqueEntityID(PERSON_ID),
        role: MemberRole.COLLABORATOR,
      },
      new UniqueEntityID(MEMBER_ID),
    );

    const raw = PrismaMemberMapper.toPrisma(
      member,
      new UniqueEntityID(ACCOUNT_ID),
    );

    expect(raw.full_name).toBeNull();
    expect(raw.cpf).toBeNull();
    expect(raw.email).toBeNull();
    expect(raw.phone).toBeNull();
  });
});
