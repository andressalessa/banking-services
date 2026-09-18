import { ManageAccountMembersUseCase } from './manage-account-members.use-case';
import { InMemoryDigitalAccountRepository } from '../../infrastructure/repositories/in-memory-digital-account.repository';
import { DigitalAccount } from '../../domain/entities/digital-account';
import { AccountHolder } from '../../domain/value-objects/account-holder';
import { BankIdentity } from '../../domain/value-objects/bank-identity';
import { Member, MemberRole, MemberStatus } from '../../domain/entities/member';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { DuplicateMemberError } from '../../domain/errors/duplicate-member-error';
import { MemberNotFoundError } from '../../domain/errors/member-not-found-error';
import { CannotRemoveLastApproverError } from '../../domain/errors/cannot-remove-last-approver-error';
import { DomainEvents } from '@/core/events/domain-events';

describe('ManageAccountMembersUseCase', () => {
  let useCase: ManageAccountMembersUseCase;
  let repository: InMemoryDigitalAccountRepository;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    repository = new InMemoryDigitalAccountRepository();
    useCase = new ManageAccountMembersUseCase(repository);
  });

  describe('addMember', () => {
    it('should add a new member successfully', async () => {
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

      const newMember = Member.create({
        personId: new UniqueEntityID('person-2'),
        role: MemberRole.OPERATOR,
        status: MemberStatus.ACTIVE,
      });

      const result = await useCase.addMember({
        accountId: account.id.toString(),
        member: newMember,
      });

      expect(result.isRight()).toBe(true);

      const updatedAccount = await repository.findById(account.id);
      expect(updatedAccount?.members).toHaveLength(2);
      expect(
        updatedAccount?.members.some((m) =>
          m.personId.equals(new UniqueEntityID('person-2')),
        ),
      ).toBe(true);
    });

    it('should not add duplicate member', async () => {
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

      // Try to add same person again
      const duplicateMember = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.OPERATOR,
        status: MemberStatus.ACTIVE,
      });

      const result = await useCase.addMember({
        accountId: account.id.toString(),
        member: duplicateMember,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateMemberError);
    });

    it('should return AccountNotFoundError when account does not exist', async () => {
      const newMember = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.OPERATOR,
        status: MemberStatus.ACTIVE,
      });

      const result = await useCase.addMember({
        accountId: 'non-existent-id',
        member: newMember,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AccountNotFoundError);
    });
  });

  describe('changeMemberStatus', () => {
    it('should change member status successfully', async () => {
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

      const operator = Member.create({
        personId: new UniqueEntityID('person-2'),
        role: MemberRole.OPERATOR,
        status: MemberStatus.ACTIVE,
      });

      const account = DigitalAccount.create({
        holder,
        bankIdentity,
        members: [admin, operator],
      });

      await repository.create(account);

      const result = await useCase.changeMemberStatus({
        accountId: account.id.toString(),
        memberId: operator.id.toString(),
        newStatus: MemberStatus.INACTIVE,
      });

      expect(result.isRight()).toBe(true);

      const updatedAccount = await repository.findById(account.id);
      const updatedOperator = updatedAccount?.members.find((m) =>
        m.id.equals(operator.id),
      );
      expect(updatedOperator?.status).toBe(MemberStatus.INACTIVE);
    });

    it('should not deactivate last approver', async () => {
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

      const operator = Member.create({
        personId: new UniqueEntityID('person-2'),
        role: MemberRole.OPERATOR,
        status: MemberStatus.ACTIVE,
      });

      const account = DigitalAccount.create({
        holder,
        bankIdentity,
        members: [admin, operator],
      });

      await repository.create(account);

      // Try to deactivate the only approver (ADMIN)
      const result = await useCase.changeMemberStatus({
        accountId: account.id.toString(),
        memberId: admin.id.toString(),
        newStatus: MemberStatus.INACTIVE,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(CannotRemoveLastApproverError);
    });

    it('should return MemberNotFoundError when member does not exist', async () => {
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

      const result = await useCase.changeMemberStatus({
        accountId: account.id.toString(),
        memberId: 'non-existent-member-id',
        newStatus: MemberStatus.INACTIVE,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(MemberNotFoundError);
    });

    it('should return AccountNotFoundError when account does not exist', async () => {
      const result = await useCase.changeMemberStatus({
        accountId: 'non-existent-id',
        memberId: 'member-id',
        newStatus: MemberStatus.INACTIVE,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AccountNotFoundError);
    });

    it('should allow deactivating approver when there are multiple approvers', async () => {
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

      const admin1 = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
      });

      const admin2 = Member.create({
        personId: new UniqueEntityID('person-2'),
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
      });

      const account = DigitalAccount.create({
        holder,
        bankIdentity,
        members: [admin1, admin2],
      });

      await repository.create(account);

      const result = await useCase.changeMemberStatus({
        accountId: account.id.toString(),
        memberId: admin1.id.toString(),
        newStatus: MemberStatus.INACTIVE,
      });

      expect(result.isRight()).toBe(true);

      const updatedAccount = await repository.findById(account.id);
      expect(updatedAccount?.approvers).toHaveLength(1);
    });
  });
});
