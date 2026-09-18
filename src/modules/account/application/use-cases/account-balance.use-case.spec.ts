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
import { ReserveAccountBalanceUseCase } from './reserve-account-balance.use-case';
import { ReleaseAccountBalanceUseCase } from './release-account-balance.use-case';
import { ConfirmAccountDebitUseCase } from './confirm-account-debit.use-case';
import { CreditAccountBalanceUseCase } from './credit-account-balance.use-case';

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

describe('Account balance use cases', () => {
  let accounts: InMemoryDigitalAccountRepository;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    accounts = new InMemoryDigitalAccountRepository();
    const account = makeActiveAccount();
    account.clearEvents();
    await accounts.save(account);
  });

  it('should reserve, release, debit and credit account balance', async () => {
    const reserve = new ReserveAccountBalanceUseCase(accounts);
    const release = new ReleaseAccountBalanceUseCase(accounts);
    const debit = new ConfirmAccountDebitUseCase(accounts);
    const credit = new CreditAccountBalanceUseCase(accounts);

    const reserved = await reserve.execute({
      accountId: 'account-1',
      amountInCents: 20000,
      reason: 'expense:expense-1',
    });
    expect(reserved.isRight()).toBe(true);
    expect(accounts.items[0].reservedBalance.value).toBe(200);

    const released = await release.execute({
      accountId: 'account-1',
      amountInCents: 20000,
      reason: 'expense-cancelled:expense-1',
    });
    expect(released.isRight()).toBe(true);
    expect(accounts.items[0].reservedBalance.value).toBe(0);

    await reserve.execute({
      accountId: 'account-1',
      amountInCents: 15000,
      reason: 'expense:expense-2',
    });
    const debited = await debit.execute({
      accountId: 'account-1',
      amountInCents: 15000,
      reason: 'expense-paid:expense-2',
    });
    expect(debited.isRight()).toBe(true);
    expect(accounts.items[0].balance.value).toBe(850);

    const credited = await credit.execute({
      accountId: 'account-1',
      amountInCents: 15000,
      reason: 'expense-refunded:expense-2',
    });
    expect(credited.isRight()).toBe(true);
    expect(accounts.items[0].balance.value).toBe(1000);
  });

  it('should return AccountNotFoundError when the account does not exist', async () => {
    const reserve = new ReserveAccountBalanceUseCase(accounts);

    const result = await reserve.execute({
      accountId: 'missing',
      amountInCents: 1000,
      reason: 'expense:expense-1',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AccountNotFoundError);
  });

  it('should return InsufficientBalanceError when available balance is too low', async () => {
    const reserve = new ReserveAccountBalanceUseCase(accounts);

    const result = await reserve.execute({
      accountId: 'account-1',
      amountInCents: 100001,
      reason: 'expense:expense-1',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InsufficientBalanceError);
  });
});
