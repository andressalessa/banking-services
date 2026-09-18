import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { Money } from '@/core/value-objects/money';
import { toMonetarySnapshot } from '@/core/events/monetary-snapshot';
import { AccountStatus } from '../enums/account-status';
import { Member, MemberStatus } from './member';
import { InsufficientBalanceError } from '../errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../errors/invalid-account-status-error';
import { DuplicateMemberError } from '../errors/duplicate-member-error';
import { MemberNotFoundError } from '../errors/member-not-found-error';
import { CannotRemoveLastApproverError } from '../errors/cannot-remove-last-approver-error';
import { AccountWithoutAdminError } from '../errors/account-without-admin-error';
import { AccountHolder } from '../value-objects/account-holder';
import { BankIdentity } from '../value-objects/bank-identity';
import { AccountCreated } from '../events/account-created.event';
import { AccountStatusChanged } from '../events/account-status-changed.event';
import { AccountBalanceReserved } from '../events/account-balance-reserved.event';
import { AccountBalanceReleased } from '../events/account-balance-released.event';
import { AccountDebited } from '../events/account-debited.event';
import { AccountCredited } from '../events/account-credited.event';
import { MemberAdded } from '../events/member-added.event';
import { MemberStatusChanged } from '../events/member-status-changed.event';

export interface DigitalAccountProps {
  holder: AccountHolder;
  status: AccountStatus;
  bankIdentity: BankIdentity;
  balance: Money;
  reservedBalance: Money;
  members: Member[];
  createdAt: Date;
  updatedAt?: Date | null;
}

const STATUS_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  [AccountStatus.PENDING]: [AccountStatus.VALIDATED, AccountStatus.CLOSED],
  [AccountStatus.VALIDATED]: [AccountStatus.ACTIVE, AccountStatus.CLOSED],
  [AccountStatus.ACTIVE]: [AccountStatus.BLOCKED, AccountStatus.CLOSED],
  [AccountStatus.BLOCKED]: [AccountStatus.ACTIVE, AccountStatus.CLOSED],
  [AccountStatus.CLOSED]: [],
};

export class DigitalAccount extends AggregateRoot<DigitalAccountProps> {
  static create(
    props: Optional<
      DigitalAccountProps,
      'status' | 'balance' | 'reservedBalance' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ) {
    if (!props.members.some((member) => member.isApprover())) {
      throw new Error('A digital account must have at least one approver.');
    }

    const account = new DigitalAccount(
      {
        holder: props.holder,
        bankIdentity: props.bankIdentity,
        members: props.members,
        status: props.status ?? AccountStatus.PENDING,
        balance: props.balance ?? Money.create(0),
        reservedBalance: props.reservedBalance ?? Money.create(0),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );

    account.addDomainEvent(
      new AccountCreated({
        aggregateId: account.id,
        accountId: account.id.toString(),
        holder: {
          cnpj: account.holder.cnpj,
          legalName: account.holder.legalName,
          tradeName: account.holder.tradeName,
        },
        bankIdentity: {
          externalAccountId: account.bankIdentity.externalAccountId,
          bankCode: account.bankIdentity.bankCode,
          branch: account.bankIdentity.branch,
          accountNumber: account.bankIdentity.accountNumber,
        },
        status: account.status,
        membersCount: account.members.length,
        approversCount: account.approvers.length,
      }),
    );

    return account;
  }

  static restore(
    props: DigitalAccountProps,
    id: UniqueEntityID,
  ): DigitalAccount {
    return new DigitalAccount(props, id);
  }

  get holder() {
    return this.props.holder;
  }

  get status() {
    return this.props.status;
  }

  get bankIdentity() {
    return this.props.bankIdentity;
  }

  get balance() {
    return this.props.balance;
  }

  get reservedBalance() {
    return this.props.reservedBalance;
  }

  get availableBalance() {
    return this.props.balance.sub(this.props.reservedBalance);
  }

  get members() {
    return this.props.members;
  }

  get approvers() {
    return this.props.members.filter((member) => member.isApprover());
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt ?? null;
  }

  public activate(): void {
    const hasActiveAdmin = this.props.members.some(
      (member) => member.role === 'ADMIN' && member.isActive,
    );

    if (!hasActiveAdmin) {
      throw new AccountWithoutAdminError();
    }

    this.props.status = AccountStatus.ACTIVE;
  }

  public reserveBalance(amount: Money, reason = 'balance-reserved') {
    this.ensureActive();

    if (!this.availableBalance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    this.props.reservedBalance = this.props.reservedBalance.sum(amount);
    this.touch();

    this.addDomainEvent(
      new AccountBalanceReserved({
        aggregateId: this.id,
        accountId: this.id.toString(),
        reservedAmount: toMonetarySnapshot(amount),
        totalReservedBalance: toMonetarySnapshot(this.props.reservedBalance),
        availableBalance: toMonetarySnapshot(this.availableBalance),
        reason,
      }),
    );
  }

  public releaseReservedBalance(amount: Money, reason = 'balance-released') {
    this.ensureActive();

    if (!this.props.reservedBalance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    this.props.reservedBalance = this.props.reservedBalance.sub(amount);
    this.touch();

    this.addDomainEvent(
      new AccountBalanceReleased({
        aggregateId: this.id,
        accountId: this.id.toString(),
        releasedAmount: toMonetarySnapshot(amount),
        totalReservedBalance: toMonetarySnapshot(this.props.reservedBalance),
        availableBalance: toMonetarySnapshot(this.availableBalance),
        reason,
      }),
    );
  }

  public confirmDebit(amount: Money, reason = 'balance-debited') {
    this.ensureActive();

    if (!this.props.reservedBalance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    this.props.balance = this.props.balance.sub(amount);
    this.props.reservedBalance = this.props.reservedBalance.sub(amount);
    this.touch();

    this.addDomainEvent(
      new AccountDebited({
        aggregateId: this.id,
        accountId: this.id.toString(),
        debitedAmount: toMonetarySnapshot(amount),
        newBalance: toMonetarySnapshot(this.props.balance),
        newReservedBalance: toMonetarySnapshot(this.props.reservedBalance),
        availableBalance: toMonetarySnapshot(this.availableBalance),
        reason,
      }),
    );
  }

  public creditBalance(amount: Money, reason: string) {
    this.ensureActive();

    this.props.balance = this.props.balance.sum(amount);
    this.touch();

    this.addDomainEvent(
      new AccountCredited({
        aggregateId: this.id,
        accountId: this.id.toString(),
        creditedAmount: toMonetarySnapshot(amount),
        newBalance: toMonetarySnapshot(this.props.balance),
        availableBalance: toMonetarySnapshot(this.availableBalance),
        reason,
      }),
    );
  }

  public changeStatus(status: AccountStatus) {
    const previousStatus = this.props.status;
    const allowed = STATUS_TRANSITIONS[previousStatus];

    if (!allowed.includes(status)) {
      throw new InvalidAccountStatusError(previousStatus, status);
    }

    this.props.status = status;
    this.touch();

    this.addDomainEvent(
      new AccountStatusChanged({
        aggregateId: this.id,
        accountId: this.id.toString(),
        previousStatus,
        newStatus: status,
      }),
    );
  }

  public addMember(member: Member): void {
    const alreadyExists = this.props.members.some((existing) =>
      existing.personId.equals(member.personId),
    );

    if (alreadyExists) {
      throw new DuplicateMemberError();
    }

    this.props.members = [...this.props.members, member];
    this.touch();

    this.addDomainEvent(
      new MemberAdded({
        aggregateId: this.id,
        accountId: this.id.toString(),
        memberId: member.id.toString(),
        personId: member.personId.toString(),
        role: member.role,
        status: member.status,
      }),
    );
  }

  public changeMemberStatus(
    memberId: UniqueEntityID,
    newStatus: MemberStatus,
  ): void {
    const member = this.props.members.find((item) => item.id.equals(memberId));

    if (!member) {
      throw new MemberNotFoundError();
    }

    const previousStatus = member.status;
    const wouldStopBeingApprover =
      member.isApprover() && newStatus === MemberStatus.INACTIVE;

    if (wouldStopBeingApprover && this.approvers.length === 1) {
      throw new CannotRemoveLastApproverError();
    }

    member.changeStatus(newStatus);
    this.touch();

    this.addDomainEvent(
      new MemberStatusChanged({
        aggregateId: this.id,
        accountId: this.id.toString(),
        memberId: member.id.toString(),
        personId: member.personId.toString(),
        previousStatus,
        newStatus,
        isApprover: member.isApprover(),
      }),
    );
  }

  private ensureActive() {
    if (this.props.status !== AccountStatus.ACTIVE) {
      throw new InvalidAccountStatusError(this.props.status);
    }
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
