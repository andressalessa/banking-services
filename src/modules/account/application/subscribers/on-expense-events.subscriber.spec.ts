import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { ConfirmAccountDebitUseCase } from '@/modules/account/application/use-cases/confirm-account-debit.use-case';
import { CreditAccountBalanceUseCase } from '@/modules/account/application/use-cases/credit-account-balance.use-case';
import { ReleaseAccountBalanceUseCase } from '@/modules/account/application/use-cases/release-account-balance.use-case';
import { ReserveAccountBalanceUseCase } from '@/modules/account/application/use-cases/reserve-account-balance.use-case';
import { InMemoryDigitalAccountRepository } from '@/modules/account/infrastructure/repositories/in-memory-digital-account.repository';
import { DigitalAccount } from '@/modules/account/domain/entities/digital-account';
import { Member, MemberRole } from '@/modules/account/domain/entities/member';
import { AccountStatus } from '@/modules/account/domain/enums/account-status';
import { AccountHolder } from '@/modules/account/domain/value-objects/account-holder';
import { BankIdentity } from '@/modules/account/domain/value-objects/bank-identity';
import { ExpenseStatus } from '@/modules/payment/domain/enums/expense-status';
import { Expense } from '@/modules/payment/domain/entities/expense';
import { Payee } from '@/modules/payment/domain/value-objects/payee';
import { PaymentDetails } from '@/modules/payment/domain/value-objects/payment-details';
import { OnExpenseEvents } from './on-expense-events.subscriber';

function makeAccount() {
  const account = DigitalAccount.create(
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
  account.clearEvents();
  return account;
}

function makeExpense() {
  const expense = Expense.create(
    {
      accountId: new UniqueEntityID('account-1'),
      payee: Payee.create({
        name: 'Example Payee',
        taxId: '12345678000195',
        taxIdType: 'CNPJ',
      }),
      amount: Money.create(200),
      paymentDetails: PaymentDetails.create({
        method: 'PIX',
        pixKey: 'example@example.com',
        pixKeyType: 'EMAIL',
      }),
      dueDate: new Date('2026-09-20'),
    },
    new UniqueEntityID('expense-1'),
  );
  expense.clearEvents();
  return expense;
}

describe('OnExpenseEvents', () => {
  let accounts: InMemoryDigitalAccountRepository;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    accounts = new InMemoryDigitalAccountRepository();
    await accounts.save(makeAccount());
  });

  describe('handleExpenseScheduled', () => {
    it('should reserve balance when an expense is scheduled', async () => {
      new OnExpenseEvents(
        new ReserveAccountBalanceUseCase(accounts),
        new ConfirmAccountDebitUseCase(accounts),
        new ReleaseAccountBalanceUseCase(accounts),
        new CreditAccountBalanceUseCase(accounts),
      );

      const expense = makeExpense();
      expense.approve('approver-person-id');
      expense.schedule();
      await DomainEvents.dispatchEventsForAggregate(expense.id);

      expect(accounts.items[0].reservedBalance.value).toBe(200);
      expect(accounts.items[0].availableBalance.value).toBe(800);
    });
  });

  describe('handleExpensePaid', () => {
    it('should confirm debit when an expense is paid', async () => {
      const account = accounts.items[0];
      account.reserveBalance(Money.create(200), 'expense:expense-1');
      account.clearEvents();
      await accounts.save(account);

      new OnExpenseEvents(
        new ReserveAccountBalanceUseCase(accounts),
        new ConfirmAccountDebitUseCase(accounts),
        new ReleaseAccountBalanceUseCase(accounts),
        new CreditAccountBalanceUseCase(accounts),
      );

      const expense = makeExpense();
      expense.approve('approver-person-id');
      expense.markAsPaid();
      await DomainEvents.dispatchEventsForAggregate(expense.id);

      expect(accounts.items[0].balance.value).toBe(800);
      expect(accounts.items[0].reservedBalance.value).toBe(0);
    });
  });

  describe('handleExpenseFailed', () => {
    it('should release reserved balance when an expense fails', async () => {
      const account = accounts.items[0];
      account.reserveBalance(Money.create(200), 'expense:expense-1');
      account.clearEvents();
      await accounts.save(account);

      new OnExpenseEvents(
        new ReserveAccountBalanceUseCase(accounts),
        new ConfirmAccountDebitUseCase(accounts),
        new ReleaseAccountBalanceUseCase(accounts),
        new CreditAccountBalanceUseCase(accounts),
      );

      const expense = makeExpense();
      expense.approve('approver-person-id');
      expense.schedule();
      expense.clearEvents();
      expense.fail('SCD timeout');
      await DomainEvents.dispatchEventsForAggregate(expense.id);

      expect(accounts.items[0].reservedBalance.value).toBe(0);
    });
  });

  describe('handleExpenseCancelled', () => {
    it('should release reserved balance when a scheduled expense is cancelled', async () => {
      const account = accounts.items[0];
      account.reserveBalance(Money.create(200), 'expense:expense-1');
      account.clearEvents();
      await accounts.save(account);

      new OnExpenseEvents(
        new ReserveAccountBalanceUseCase(accounts),
        new ConfirmAccountDebitUseCase(accounts),
        new ReleaseAccountBalanceUseCase(accounts),
        new CreditAccountBalanceUseCase(accounts),
      );

      const expense = makeExpense();
      expense.approve('approver-person-id');
      expense.schedule();
      expense.clearEvents();
      expense.cancel();
      await DomainEvents.dispatchEventsForAggregate(expense.id);

      expect(expense.status).toBe(ExpenseStatus.CANCELLED);
      expect(accounts.items[0].reservedBalance.value).toBe(0);
    });

    it('should not release reserved balance when a draft expense is cancelled', async () => {
      const account = accounts.items[0];
      account.reserveBalance(Money.create(200), 'unrelated');
      account.clearEvents();
      await accounts.save(account);

      new OnExpenseEvents(
        new ReserveAccountBalanceUseCase(accounts),
        new ConfirmAccountDebitUseCase(accounts),
        new ReleaseAccountBalanceUseCase(accounts),
        new CreditAccountBalanceUseCase(accounts),
      );

      const expense = makeExpense();
      expense.cancel();
      await DomainEvents.dispatchEventsForAggregate(expense.id);

      expect(accounts.items[0].reservedBalance.value).toBe(200);
    });
  });

  describe('handleExpenseRefunded', () => {
    it('should credit balance when an expense is refunded', async () => {
      new OnExpenseEvents(
        new ReserveAccountBalanceUseCase(accounts),
        new ConfirmAccountDebitUseCase(accounts),
        new ReleaseAccountBalanceUseCase(accounts),
        new CreditAccountBalanceUseCase(accounts),
      );

      const expense = makeExpense();
      expense.approve('approver-person-id');
      expense.markAsPaid();
      expense.clearEvents();
      expense.refund();
      await DomainEvents.dispatchEventsForAggregate(expense.id);

      expect(accounts.items[0].balance.value).toBe(1200);
    });
  });
});
