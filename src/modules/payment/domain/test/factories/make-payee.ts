import { Payee, PayeeProps } from '../../value-objects/payee';

export function makePayee(override: Partial<PayeeProps> = {}): Payee {
  return Payee.create({
    name: 'Test Payee',
    taxId: '12345678000195',
    taxIdType: 'CNPJ',
    ...override,
  });
}
