import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Money } from '@/core/value-objects/money';
import { DigitalAccount } from '@/modules/account/domain/entities/digital-account';
import { Member, MemberRole } from '@/modules/account/domain/entities/member';
import { AccountHolder } from '@/modules/account/domain/value-objects/account-holder';
import { BankIdentity } from '@/modules/account/domain/value-objects/bank-identity';
import { PrismaAccountMapper } from './prisma-account.mapper';

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PERSON_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('PrismaAccountMapper', () => {
  const now = new Date('2026-01-10T08:00:00.000Z');

  it('should convert Prisma account with members to Domain aggregate without events', () => {
    const account = PrismaAccountMapper.toDomain({
      id: ACCOUNT_ID,
      holder_cnpj: '12345678000195',
      holder_legal_name: 'Empresa XYZ Ltda',
      holder_trade_name: 'XYZ',
      balance_cents: BigInt(1000000),
      reserved_balance_cents: BigInt(50000),
      currency: 'BRL',
      status: 'ACTIVE',
      bank_code: '001',
      bank_branch: '0001',
      bank_account_number: '123456-7',
      external_account_id: 'ext-account-1',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      members: [
        {
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
        },
      ],
    });

    expect(account).toBeInstanceOf(DigitalAccount);
    expect(account.id.toString()).toBe(ACCOUNT_ID);
    expect(account.holder.cnpj).toBe('12345678000195');
    expect(account.holder.legalName).toBe('Empresa XYZ Ltda');
    expect(account.balance.amountInCents).toBe(1000000);
    expect(account.reservedBalance.amountInCents).toBe(50000);
    expect(account.bankIdentity.bankCode).toBe('001');
    expect(account.members).toHaveLength(1);
    expect(account.approvers).toHaveLength(1);
    expect(account.domainEvents).toHaveLength(0);
  });

  it('should convert Domain account to Prisma persistence payload', () => {
    const account = DigitalAccount.create(
      {
        holder: AccountHolder.create({
          cnpj: '12345678000195',
          legalName: 'Empresa XYZ Ltda',
          tradeName: 'XYZ',
        }),
        bankIdentity: BankIdentity.create({
          externalAccountId: 'ext-account-1',
          bankCode: '001',
          branch: '0001',
          accountNumber: '123456-7',
        }),
        members: [
          Member.create(
            {
              personId: new UniqueEntityID(PERSON_ID),
              fullName: 'João Silva',
              role: MemberRole.ADMIN,
            },
            new UniqueEntityID(MEMBER_ID),
          ),
        ],
        balance: Money.create(10000),
        reservedBalance: Money.create(500),
      },
      new UniqueEntityID(ACCOUNT_ID),
    );

    const persistence = PrismaAccountMapper.toPrisma(account);

    expect(persistence.account.id).toBe(ACCOUNT_ID);
    expect(persistence.account.holder_cnpj).toBe('12345678000195');
    expect(persistence.account.balance_cents).toBe(BigInt(1000000));
    expect(persistence.account.reserved_balance_cents).toBe(BigInt(50000));
    expect(persistence.account.bank_code).toBe('001');
    expect(persistence.members).toHaveLength(1);
    expect(persistence.members[0].id).toBe(MEMBER_ID);
    expect(persistence.members[0].account_id).toBe(ACCOUNT_ID);
  });
});
