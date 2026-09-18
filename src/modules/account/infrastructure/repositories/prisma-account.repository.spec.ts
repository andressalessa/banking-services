import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/core/infrastructure/database/prisma.service';
import { Money } from '@/core/value-objects/money';
import { AccountStatus } from '@/modules/account/domain/enums/account-status';
import { makeDigitalAccount } from '@/modules/account/domain/test/factories/make-digital-account';
import { makeMember } from '@/modules/account/domain/test/factories/make-member';
import { PrismaAccountRepository } from './prisma-account.repository';
import { startPrismaTestDatabase } from 'test/setup-prisma-container';

describe('PrismaAccountRepository (Integration)', () => {
  let container: Awaited<ReturnType<typeof startPrismaTestDatabase>>['container'];
  let prisma: PrismaService;
  let repository: PrismaAccountRepository;

  beforeAll(async () => {
    const setup = await startPrismaTestDatabase();
    container = setup.container;
    prisma = setup.prisma;
    repository = new PrismaAccountRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
  });

  function makePersistedAccount() {
    return makeDigitalAccount({
      members: [
        makeMember({
          personId: new UniqueEntityID(),
        }),
      ],
      balance: Money.create(1000),
      reservedBalance: Money.create(0),
      status: AccountStatus.ACTIVE,
    });
  }

  describe('create / findById', () => {
    it('should persist an account with members and restore the aggregate', async () => {
      const account = makePersistedAccount();

      await repository.create(account);

      const found = await repository.findById(account.id);

      expect(found).not.toBeNull();
      expect(found!.id.toString()).toBe(account.id.toString());
      expect(found!.holder.cnpj).toBe(account.holder.cnpj);
      expect(found!.balance.amountInCents).toBe(100000);
      expect(found!.members).toHaveLength(1);
      expect(found!.approvers).toHaveLength(1);
      expect(found!.domainEvents).toHaveLength(0);
    });

    it('should return null if account is not found', async () => {
      const found = await repository.findById(new UniqueEntityID());

      expect(found).toBeNull();
    });
  });

  describe('save', () => {
    it('should update balance and members inside a transaction', async () => {
      const account = makePersistedAccount();
      await repository.create(account);

      account.reserveBalance(Money.create(100), 'hold-for-expense');
      await repository.save(account);

      const found = await repository.findById(account.id);

      expect(found).not.toBeNull();
      expect(found!.reservedBalance.amountInCents).toBe(10000);
      expect(found!.availableBalance.amountInCents).toBe(90000);
    });
  });
});
