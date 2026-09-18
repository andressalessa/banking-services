import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvent } from '@/core/events/domain-event';
import { AccountStatus } from '../enums/account-status';

export interface AccountCreatedHolder {
  cnpj: string;
  legalName: string;
  tradeName: string;
}

export interface AccountCreatedBankIdentity {
  externalAccountId: string;
  bankCode: string;
  branch: string;
  accountNumber: string;
}

export interface AccountCreatedProps {
  aggregateId: UniqueEntityID;
  accountId: string;
  holder: AccountCreatedHolder;
  bankIdentity: AccountCreatedBankIdentity;
  status: AccountStatus;
  membersCount: number;
  approversCount: number;
}

export class AccountCreated implements DomainEvent {
  public readonly ocurredAt: Date;
  public readonly aggregateId: UniqueEntityID;
  public readonly accountId: string;
  public readonly holder: AccountCreatedHolder;
  public readonly bankIdentity: AccountCreatedBankIdentity;
  public readonly status: AccountStatus;
  public readonly membersCount: number;
  public readonly approversCount: number;

  constructor(props: AccountCreatedProps) {
    this.aggregateId = props.aggregateId;
    this.accountId = props.accountId;
    this.holder = props.holder;
    this.bankIdentity = props.bankIdentity;
    this.status = props.status;
    this.membersCount = props.membersCount;
    this.approversCount = props.approversCount;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
