import { ChangeDigitalAccountStatusUseCase } from './change-digital-account-status';
import { InMemoryDigitalAccountRepository } from '../../infrastructure/repositories/in-memory-digital-account.repository';
import { DigitalAccount } from '../../domain/entities/digital-account';
import { AccountHolder } from '../../domain/value-objects/account-holder';
import { BankIdentity } from '../../domain/value-objects/bank-identity';
import { Member, MemberRole, MemberStatus } from '../../domain/entities/member';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { AccountStatus } from '../../domain/enums/account-status';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { InvalidAccountStatusError } from '../../domain/errors/invalid-account-status-error';
import { DomainEvents } from '@/core/events/domain-events';

describe('ChangeDigitalAccountStatusUseCase', () => {
  let useCase: ChangeDigitalAccountStatusUseCase;
  let repository: InMemoryDigitalAccountRepository;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryDigitalAccountRepository();
    useCase = new ChangeDigitalAccountStatusUseCase(repository);
  });

  it('should change account status successfully', async () => {
    const holder = AccountHolder.create({
      cnpj: '12.345.678/0001-95',
      legalName: 'Test Company LTDA',
      tradeName: 'Test Company',
    });

    const bankIdentity = BankIdentity.create({
      externalAccountId: 'ext-123',
      bankCode: '001',
      branch: '1234',
      accountNumber: '123456-7',
    });

    const admin = Member.create({
      personId: new UniqueEntityID('person-1'),
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
    });

    const account = DigitalAccount.create({
      holder,
      bankIdentity,
      members: [admin],
    });

    await repository.create(account);

    // Change from PENDING to VALIDATED
    const result = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.VALIDATED,
    });

    expect(result.isRight()).toBe(true);

    const updatedAccount = await repository.findById(account.id);
    expect(updatedAccount?.status).toBe(AccountStatus.VALIDATED);
  });

  it('should not change to invalid status transition', async () => {
    const holder = AccountHolder.create({
      cnpj: '12.345.678/0001-95',
      legalName: 'Test Company LTDA',
      tradeName: 'Test Company',
    });

    const bankIdentity = BankIdentity.create({
      externalAccountId: 'ext-123',
      bankCode: '001',
      branch: '1234',
      accountNumber: '123456-7',
    });

    const admin = Member.create({
      personId: new UniqueEntityID('person-1'),
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
    });

    const account = DigitalAccount.create({
      holder,
      bankIdentity,
      members: [admin],
    });

    await repository.create(account);

    // Try to change from PENDING directly to ACTIVE (invalid transition)
    const result = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.ACTIVE,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidAccountStatusError);
  });

  it('should return AccountNotFoundError when account does not exist', async () => {
    const result = await useCase.execute({
      accountId: 'non-existent-id',
      newStatus: AccountStatus.VALIDATED,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AccountNotFoundError);
  });

  it('should not allow changing status of closed account', async () => {
    const holder = AccountHolder.create({
      cnpj: '12.345.678/0001-95',
      legalName: 'Test Company LTDA',
      tradeName: 'Test Company',
    });

    const bankIdentity = BankIdentity.create({
      externalAccountId: 'ext-123',
      bankCode: '001',
      branch: '1234',
      accountNumber: '123456-7',
    });

    const admin = Member.create({
      personId: new UniqueEntityID('person-1'),
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
    });

    const account = DigitalAccount.create({
      holder,
      bankIdentity,
      members: [admin],
      status: AccountStatus.CLOSED,
    });

    await repository.create(account);

    // Try to change from CLOSED to any other status (not allowed)
    const result = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.ACTIVE,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidAccountStatusError);
  });

  it('should follow complete status transition flow', async () => {
    const holder = AccountHolder.create({
      cnpj: '12.345.678/0001-95',
      legalName: 'Test Company LTDA',
      tradeName: 'Test Company',
    });

    const bankIdentity = BankIdentity.create({
      externalAccountId: 'ext-123',
      bankCode: '001',
      branch: '1234',
      accountNumber: '123456-7',
    });

    const admin = Member.create({
      personId: new UniqueEntityID('person-1'),
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
    });

    const account = DigitalAccount.create({
      holder,
      bankIdentity,
      members: [admin],
    });

    await repository.create(account);

    // PENDING -> VALIDATED
    const result1 = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.VALIDATED,
    });
    expect(result1.isRight()).toBe(true);

    // VALIDATED -> ACTIVE
    const result2 = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.ACTIVE,
    });
    expect(result2.isRight()).toBe(true);

    // ACTIVE -> BLOCKED
    const result3 = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.BLOCKED,
    });
    expect(result3.isRight()).toBe(true);

    // BLOCKED -> ACTIVE
    const result4 = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.ACTIVE,
    });
    expect(result4.isRight()).toBe(true);

    // ACTIVE -> CLOSED
    const result5 = await useCase.execute({
      accountId: account.id.toString(),
      newStatus: AccountStatus.CLOSED,
    });
    expect(result5.isRight()).toBe(true);

    const finalAccount = await repository.findById(account.id);
    expect(finalAccount?.status).toBe(AccountStatus.CLOSED);
  });
});
