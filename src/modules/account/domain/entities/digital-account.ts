import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { Money } from '@/core/value-objects/money';
import { AccountStatus } from './account-status';
import { Member } from './member';
import { InsufficientBalanceError } from '../errors/insufficient-balance-error';
import { InvalidAccountStatusError } from '../errors/invalid-account-status-error';
import { AccountHolder } from '../value-objects/account-holder';
import { BankIdentity } from '../value-objects/bank-identity';

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

    return new DigitalAccount(
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

  public reserveBalance(amount: Money) {
    this.ensureActive();

    if (!this.availableBalance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    this.props.reservedBalance = this.props.reservedBalance.sum(amount);
    this.touch();
  }

  public releaseReservedBalance(amount: Money) {
    this.ensureActive();

    if (!this.props.reservedBalance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    this.props.reservedBalance = this.props.reservedBalance.sub(amount);
    this.touch();
  }

  public confirmDebit(amount: Money) {
    this.ensureActive();

    if (!this.props.reservedBalance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    this.props.balance = this.props.balance.sub(amount);
    this.props.reservedBalance = this.props.reservedBalance.sub(amount);
    this.touch();
  }

  public changeStatus(status: AccountStatus) {
    const allowed = STATUS_TRANSITIONS[this.props.status];

    if (!allowed.includes(status)) {
      throw new InvalidAccountStatusError(this.props.status, status);
    }

    this.props.status = status;
    this.touch();
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
