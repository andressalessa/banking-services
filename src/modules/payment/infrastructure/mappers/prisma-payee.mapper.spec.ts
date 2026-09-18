import { PrismaPayeeMapper } from './prisma-payee.mapper';
import { Payee } from '@/modules/payment/domain/value-objects/payee';

describe('PrismaPayeeMapper', () => {
  describe('toDomain', () => {
    it('should convert CPF payee fields to Payee', () => {
      const payee = PrismaPayeeMapper.toDomain({
        payee_name: 'John Doe',
        payee_tax_id: '39053344705',
        payee_tax_id_type: 'CPF',
        payee_email: null,
      });

      expect(payee).toBeInstanceOf(Payee);
      expect(payee.name).toBe('John Doe');
      expect(payee.taxId).toBe('39053344705');
      expect(payee.taxIdType).toBe('CPF');
      expect(payee.email).toBeUndefined();
    });

    it('should convert CNPJ payee fields including optional email', () => {
      const payee = PrismaPayeeMapper.toDomain({
        payee_name: 'Company LLC',
        payee_tax_id: '12345678000195',
        payee_tax_id_type: 'CNPJ',
        payee_email: 'ap@company.com',
      });

      expect(payee.taxIdType).toBe('CNPJ');
      expect(payee.taxId).toBe('12345678000195');
      expect(payee.email).toBe('ap@company.com');
    });
  });

  describe('toPrisma', () => {
    it('should flatten Payee into persistence columns', () => {
      const payee = Payee.create({
        name: 'John Doe',
        taxId: '390.533.447-05',
        taxIdType: 'CPF',
        email: 'john@example.com',
      });

      expect(PrismaPayeeMapper.toPrisma(payee)).toEqual({
        payee_name: 'John Doe',
        payee_tax_id: '39053344705',
        payee_tax_id_type: 'CPF',
        payee_email: 'john@example.com',
      });
    });
  });
});
