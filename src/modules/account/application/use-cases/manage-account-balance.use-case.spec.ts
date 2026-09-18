import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { AccountStatus } from '../../domain/enums/account-status';
import { DigitalAccount } from '../../domain/entities/digital-account';
import { Member, MemberRole } from '../../domain/entities/member';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { InsufficientBalanceError } from '../../domain/errors/insufficient-balance-error';
import { AccountHolder } from '../../domain/value-objects/account-holder';
import { BankIdentity } from '../../domain/value-objects/bank-identity';
import { InMemoryDigitalAccountRepository } from '../../infrastructure/repositories/in-memory-digital-account.repository';
import { ManageAccountBalanceUseCase } from './manage-account-balance.use-case';

function makeActiveAccount() {
  return DigitalAccount.create(
    {
      holder: AccountHolder.create({
        cnpj: '12.345.678/0001-95',
        legalName: 'Company LLC',
        tradeName: 'Company',
      }),
      bankIdentity: BankIdentity.create({
        externalAccountId: 'scd-account-1',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
      }),
      members: [
        Member.create({
          personId: new UniqueEntityID('person-admin'),
          role: MemberRole.ADMIN,
        }),
      ],
      status: AccountStatus.ACTIVE,
      balance: Money.create(1000),
    },
    new UniqueEntityID('account-1'),
  );
}

describe('ManageAccountBalanceUseCase', () => {
  let accounts: InMemoryDigitalAccountRepository;
  let manageBalance: ManageAccountBalanceUseCase;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    accounts = new InMemoryDigitalAccountRepository();
    manageBalance = new ManageAccountBalanceUseCase(accounts);

    const account = makeActiveAccount();
    account.clearEvents();
    await accounts.save(account);
  });

  describe('complete balance operation flow', () => {
    it('should reserve, release, debit and credit account balance', async () => {
      // Reserve balance for expense
      const reserved = await manageBalance.reserveBalance({
        accountId: 'account-1',
        amountInCents: 20000,
        reason: 'expense:expense-1',
      });
      expect(reserved.isRight()).toBe(true);
      expect(accounts.items[0].reservedBalance.value).toBe(200);

      // Release reserved balance (expense cancelled)
      const released = await manageBalance.releaseBalance({
        accountId: 'account-1',
        amountInCents: 20000,
        reason: 'expense-cancelled:expense-1',
      });
      expect(released.isRight()).toBe(true);
      expect(accounts.items[0].reservedBalance.value).toBe(0);

      // Reserve again for new expense
      await manageBalance.reserveBalance({
        accountId: 'account-1',
        amountInCents: 15000,
        reason: 'expense:expense-2',
      });

      // Confirm debit (expense paid)
      const debited = await manageBalance.confirmDebit({
        accountId: 'account-1',
        amountInCents: 15000,
        reason: 'expense-paid:expense-2',
      });
      expect(debited.isRight()).toBe(true);
      expect(accounts.items[0].balance.value).toBe(850);

      // Credit balance back (expense refunded)
      const credited = await manageBalance.creditBalance({
        accountId: 'account-1',
        amountInCents: 15000,
        reason: 'expense-refunded:expense-2',
      });
      expect(credited.isRight()).toBe(true);
      expect(accounts.items[0].balance.value).toBe(1000);
    });
  });

  describe('reserveBalance', () => {
    it('should reserve balance successfully', async () => {
      const result = await manageBalance.reserveBalance({
        accountId: 'account-1',
        amountInCents: 50000,
        reason: 'expense:expense-1',
      });

      expect(result.isRight()).toBe(true);
      expect(accounts.items[0].reservedBalance.value).toBe(500);
      expect(accounts.items[0].availableBalance.value).toBe(500);
    });

    it('should return InsufficientBalanceError when available balance is too low', async () => {
      const result = await manageBalance.reserveBalance({
        accountId: 'account-1',
        amountInCents: 100001,
        reason: 'expense:expense-1',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InsufficientBalanceError);
    });

    it('should return AccountNotFoundError when account does not exist', async () => {
      const result = await manageBalance.reserveBalance({
        accountId: 'missing',
        amountInCents: 1000,
        reason: 'expense:expense-1',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AccountNotFoundError);
    });
  });

  describe('confirmDebit', () => {
    it('should confirm debit from reserved balance', async () => {
      // First reserve
      await manageBalance.reserveBalance({
        accountId: 'account-1',
        amountInCents: 30000,
        reason: 'expense:expense-1',
      });

      // Then confirm debit
      const result = await manageBalance.confirmDebit({
        accountId: 'account-1',
        amountInCents: 30000,
        reason: 'expense-paid:expense-1',
      });

      expect(result.isRight()).toBe(true);
      expect(accounts.items[0].balance.value).toBe(700);
      expect(accounts.items[0].reservedBalance.value).toBe(0);
    });

    it('should return InsufficientBalanceError when reserved balance is too low', async () => {
      const result = await manageBalance.confirmDebit({
        accountId: 'account-1',
        amountInCents: 1000,
        reason: 'expense-paid:expense-1',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InsufficientBalanceError);
    });
  });

  describe('releaseBalance', () => {
    it('should release reserved balance', async () => {
      // First reserve
      await manageBalance.reserveBalance({
        accountId: 'account-1',
        amountInCents: 40000,
        reason: 'expense:expense-1',
      });

      // Then release
      const result = await manageBalance.releaseBalance({
        accountId: 'account-1',
        amountInCents: 40000,
        reason: 'expense-failed:expense-1',
      });

      expect(result.isRight()).toBe(true);
      expect(accounts.items[0].reservedBalance.value).toBe(0);
      expect(accounts.items[0].availableBalance.value).toBe(1000);
    });

    it('should return InsufficientBalanceError when trying to release more than reserved', async () => {
      const result = await manageBalance.releaseBalance({
        accountId: 'account-1',
        amountInCents: 1000,
        reason: 'expense-failed:expense-1',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InsufficientBalanceError);
    });
  });

  describe('creditBalance', () => {
    it('should credit balance back', async () => {
      const result = await manageBalance.creditBalance({
        accountId: 'account-1',
        amountInCents: 25000,
        reason: 'expense-refunded:expense-1',
      });

      expect(result.isRight()).toBe(true);
      expect(accounts.items[0].balance.value).toBe(1250);
    });

    it('should return AccountNotFoundError when account does not exist', async () => {
      const result = await manageBalance.creditBalance({
        accountId: 'missing',
        amountInCents: 1000,
        reason: 'expense-refunded:expense-1',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AccountNotFoundError);
    });
  });
});
