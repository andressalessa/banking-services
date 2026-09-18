import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Money } from '@/core/value-objects/money';
import { AccountStatus } from '../enums/account-status';
import { AccountHolder } from '../value-objects/account-holder';
import { BankIdentity } from '../value-objects/bank-identity';
import { CannotRemoveLastApproverError } from '../errors/cannot-remove-last-approver-error';
import { DuplicateMemberError } from '../errors/duplicate-member-error';
import { InsufficientBalanceError } from '../errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../errors/invalid-account-status-error';
import { MemberNotFoundError } from '../errors/member-not-found-error';
import { AccountCreated } from '../events/account-created.event';
import { AccountStatusChanged } from '../events/account-status-changed.event';
import { AccountBalanceReserved } from '../events/account-balance-reserved.event';
import { AccountBalanceReleased } from '../events/account-balance-released.event';
import { AccountDebited } from '../events/account-debited.event';
import { AccountCredited } from '../events/account-credited.event';
import { MemberAdded } from '../events/member-added.event';
import { MemberStatusChanged } from '../events/member-status-changed.event';
import { DigitalAccount } from './digital-account';
import { Member, MemberRole, MemberStatus } from './member';

describe('DigitalAccount Aggregate Root', () => {
  const makeApprover = (personId = 'person-admin') =>
    Member.create({
      personId: new UniqueEntityID(personId),
      role: MemberRole.ADMIN,
    });

  const makeAccount = (
    overrides?: Partial<{
      status: AccountStatus;
      balance: Money;
      reservedBalance: Money;
      members: Member[];
    }>,
  ) =>
    DigitalAccount.create({
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
      members: overrides?.members ?? [makeApprover()],
      status: overrides?.status ?? AccountStatus.ACTIVE,
      balance: overrides?.balance ?? Money.create(1000),
      reservedBalance: overrides?.reservedBalance ?? Money.create(0),
    });

  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  it('should emit AccountCreated when a digital account is created', () => {
    const account = makeAccount();
    const event = account.domainEvents[0] as AccountCreated;

    expect(account.domainEvents).toHaveLength(1);
    expect(event).toBeInstanceOf(AccountCreated);
    expect(event.accountId).toBe(account.id.toString());
    expect(event.status).toBe(AccountStatus.ACTIVE);
    expect(event.membersCount).toBe(1);
    expect(event.approversCount).toBe(1);
    expect(event.holder.cnpj).toBe('12345678000195');
  });

  it('should not emit events when restoring a digital account', () => {
    const created = makeAccount();

    const restored = DigitalAccount.restore(
      {
        holder: created.holder,
        bankIdentity: created.bankIdentity,
        members: created.members,
        status: created.status,
        balance: created.balance,
        reservedBalance: created.reservedBalance,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      created.id,
    );

    expect(restored.domainEvents).toHaveLength(0);
  });

  it('should emit AccountStatusChanged on a valid transition', () => {
    const account = makeAccount({ status: AccountStatus.PENDING });
    account.clearEvents();

    account.changeStatus(AccountStatus.VALIDATED);

    expect(account.status).toBe(AccountStatus.VALIDATED);
    expect(account.domainEvents[0]).toBeInstanceOf(AccountStatusChanged);
    expect(
      (account.domainEvents[0] as AccountStatusChanged).previousStatus,
    ).toBe(AccountStatus.PENDING);
    expect((account.domainEvents[0] as AccountStatusChanged).newStatus).toBe(
      AccountStatus.VALIDATED,
    );
  });

  it('should reserve, release and debit balance while emitting events', () => {
    const account = makeAccount();
    account.clearEvents();
    const amount = Money.create(200);

    account.reserveBalance(amount, 'expense:expense-1');

    expect(account.reservedBalance.value).toBe(200);
    expect(account.availableBalance.value).toBe(800);
    expect(account.domainEvents[0]).toBeInstanceOf(AccountBalanceReserved);
    expect((account.domainEvents[0] as AccountBalanceReserved).reason).toBe(
      'expense:expense-1',
    );

    account.releaseReservedBalance(amount, 'expense-cancelled:expense-1');

    expect(account.reservedBalance.value).toBe(0);
    expect(account.domainEvents[1]).toBeInstanceOf(AccountBalanceReleased);

    account.reserveBalance(amount, 'expense:expense-1');
    account.confirmDebit(amount, 'expense-paid:expense-1');

    expect(account.balance.value).toBe(800);
    expect(account.reservedBalance.value).toBe(0);
    expect(account.domainEvents[3]).toBeInstanceOf(AccountDebited);
  });

  it('should credit balance for refunds', () => {
    const account = makeAccount({ balance: Money.create(800) });
    account.clearEvents();

    account.creditBalance(Money.create(200), 'expense-refunded:expense-1');

    expect(account.balance.value).toBe(1000);
    expect(account.domainEvents[0]).toBeInstanceOf(AccountCredited);
  });

  it('should throw when reserving more than the available balance', () => {
    const account = makeAccount({ balance: Money.create(100) });

    expect(() => account.reserveBalance(Money.create(101))).toThrow(
      InsufficientBalanceError,
    );
  });

  it('should throw when operating balance on a non-active account', () => {
    const account = makeAccount({ status: AccountStatus.PENDING });

    expect(() => account.reserveBalance(Money.create(10))).toThrow(
      InvalidAccountStatusError,
    );
  });

  it('should add a member and emit MemberAdded', () => {
    const account = makeAccount();
    account.clearEvents();
    const collaborator = Member.create({
      personId: new UniqueEntityID('person-collab'),
      role: MemberRole.COLLABORATOR,
    });

    account.addMember(collaborator);

    expect(account.members).toHaveLength(2);
    expect(account.domainEvents[0]).toBeInstanceOf(MemberAdded);
    expect((account.domainEvents[0] as MemberAdded).personId).toBe(
      'person-collab',
    );
  });

  it('should not add a duplicated person as member', () => {
    const account = makeAccount();
    const duplicated = Member.create({
      personId: new UniqueEntityID('person-admin'),
      role: MemberRole.COLLABORATOR,
    });

    expect(() => account.addMember(duplicated)).toThrow(DuplicateMemberError);
  });

  it('should change member status and emit MemberStatusChanged', () => {
    const account = makeAccount({
      members: [
        makeApprover('person-admin'),
        Member.create({
          personId: new UniqueEntityID('person-collab'),
          role: MemberRole.COLLABORATOR,
        }),
      ],
    });
    account.clearEvents();
    const collaborator = account.members[1];

    account.changeMemberStatus(collaborator.id, MemberStatus.INACTIVE);

    expect(collaborator.status).toBe(MemberStatus.INACTIVE);
    expect(account.domainEvents[0]).toBeInstanceOf(MemberStatusChanged);
    expect((account.domainEvents[0] as MemberStatusChanged).isApprover).toBe(
      false,
    );
  });

  it('should not inactivate the last approver', () => {
    const account = makeAccount();

    expect(() =>
      account.changeMemberStatus(account.members[0].id, MemberStatus.INACTIVE),
    ).toThrow(CannotRemoveLastApproverError);
  });

  it('should throw when changing status of an unknown member', () => {
    const account = makeAccount();

    expect(() =>
      account.changeMemberStatus(
        new UniqueEntityID('missing'),
        MemberStatus.INACTIVE,
      ),
    ).toThrow(MemberNotFoundError);
  });
});
