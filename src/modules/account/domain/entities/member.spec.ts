import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CPF } from '@/core/value-objects/cpf';
import { Email } from '@/core/value-objects/email';
import { Phone } from '@/core/value-objects/phone';
import { Member, MemberRole, MemberStatus } from './member';

describe('Member', () => {
  describe('create', () => {
    it('should create member with valid data', () => {
      const cpf = CPF.create('39053344705').value as CPF;
      const email = Email.create('test@example.com').value as Email;
      const phone = Phone.create('+5511987654321').value as Phone;

      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        fullName: 'John Doe',
        cpf,
        email,
        phone,
        role: MemberRole.ADMIN,
      });

      expect(member.personId.toString()).toBe('person-1');
      expect(member.fullName).toBe('John Doe');
      expect(member.cpf).toEqual(cpf);
      expect(member.email).toEqual(email);
      expect(member.phone).toEqual(phone);
      expect(member.role).toBe(MemberRole.ADMIN);
      expect(member.status).toBe(MemberStatus.ACTIVE);
    });

    it('should create member with minimal data (no cpf, email, phone)', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-2'),
        role: MemberRole.COLLABORATOR,
      });

      expect(member.personId.toString()).toBe('person-2');
      expect(member.fullName).toBeUndefined();
      expect(member.cpf).toBeUndefined();
      expect(member.email).toBeUndefined();
      expect(member.phone).toBeUndefined();
      expect(member.role).toBe(MemberRole.COLLABORATOR);
      expect(member.status).toBe(MemberStatus.ACTIVE);
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote collaborator to admin', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.COLLABORATOR,
      });

      member.promoteToAdmin();

      expect(member.role).toBe(MemberRole.ADMIN);
    });
  });

  describe('demoteToCollaborator', () => {
    it('should demote admin to collaborator', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
      });

      member.demoteToCollaborator();

      expect(member.role).toBe(MemberRole.COLLABORATOR);
    });
  });

  describe('activate/deactivate', () => {
    it('should deactivate active member', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
      });

      member.deactivate();

      expect(member.status).toBe(MemberStatus.INACTIVE);
      expect(member.isActive()).toBe(false);
    });

    it('should activate inactive member', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
        status: MemberStatus.INACTIVE,
      });

      member.activate();

      expect(member.status).toBe(MemberStatus.ACTIVE);
      expect(member.isActive()).toBe(true);
    });
  });

  describe('changeStatus', () => {
    it('should change member status', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
      });

      member.changeStatus(MemberStatus.INACTIVE);

      expect(member.status).toBe(MemberStatus.INACTIVE);
    });
  });

  describe('isApprover', () => {
    it('should return true for active admin', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
      });

      expect(member.isApprover()).toBe(true);
    });

    it('should return false for active collaborator', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.COLLABORATOR,
      });

      expect(member.isApprover()).toBe(false);
    });

    it('should return false for inactive admin', () => {
      const member = Member.create({
        personId: new UniqueEntityID('person-1'),
        role: MemberRole.ADMIN,
        status: MemberStatus.INACTIVE,
      });

      expect(member.isApprover()).toBe(false);
    });
  });
});
