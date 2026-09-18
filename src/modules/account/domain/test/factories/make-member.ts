import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CPF } from '@/core/value-objects/cpf';
import { Email } from '@/core/value-objects/email';
import { Phone } from '@/core/value-objects/phone';
import { Member, MemberProps, MemberRole } from '../../entities/member';

export function makeMember(
  override: Partial<MemberProps> = {},
): Member {
  const cpfResult = CPF.create('39053344705');
  const emailResult = Email.create('member@example.com');
  const phoneResult = Phone.create('+5511987654321');

  return Member.create({
    personId: new UniqueEntityID('person-1'),
    fullName: 'John Doe',
    cpf: cpfResult.isRight() ? cpfResult.value : undefined,
    email: emailResult.isRight() ? emailResult.value : undefined,
    phone: phoneResult.isRight() ? phoneResult.value : undefined,
    role: MemberRole.ADMIN,
    ...override,
  });
}
