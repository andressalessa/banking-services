import { InvalidCpfError } from '@/core/errors/invalid-cpf-error';
import { InvalidCnpjError } from '@/core/errors/invalid-cnpj-error';
import { InvalidEmailError } from '@/core/errors/invalid-email-error';
import { Payee } from './payee';

describe('Payee', () => {
  describe('create', () => {
    it('should create payee with valid CPF', () => {
      const payee = Payee.create({
        name: 'John Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      expect(payee.name).toBe('John Doe');
      expect(payee.taxId).toBe('39053344705');
      expect(payee.taxIdType).toBe('CPF');
    });

    it('should create payee with valid CNPJ', () => {
      const payee = Payee.create({
        name: 'Company LLC',
        taxId: '12345678000195',
        taxIdType: 'CNPJ',
      });

      expect(payee.name).toBe('Company LLC');
      expect(payee.taxId).toBe('12345678000195');
      expect(payee.taxIdType).toBe('CNPJ');
    });

    it('should create payee with valid email', () => {
      const payee = Payee.create({
        name: 'John Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
        email: 'john@example.com',
      });

      expect(payee.email).toBe('john@example.com');
    });

    it('should throw error for invalid CPF', () => {
      expect(() =>
        Payee.create({
          name: 'John Doe',
          taxId: '00000000000',
          taxIdType: 'CPF',
        }),
      ).toThrow(InvalidCpfError);
    });

    it('should throw error for invalid CNPJ', () => {
      expect(() =>
        Payee.create({
          name: 'Company LLC',
          taxId: '00000000000000',
          taxIdType: 'CNPJ',
        }),
      ).toThrow(InvalidCnpjError);
    });

    it('should throw error for invalid email', () => {
      expect(() =>
        Payee.create({
          name: 'John Doe',
          taxId: '39053344705',
          taxIdType: 'CPF',
          email: 'invalid-email',
        }),
      ).toThrow(InvalidEmailError);
    });

    it('should throw error for name with less than 2 characters', () => {
      expect(() =>
        Payee.create({
          name: 'J',
          taxId: '39053344705',
          taxIdType: 'CPF',
        }),
      ).toThrow('Payee name must have at least 2 characters.');
    });

    it('should trim payee name', () => {
      const payee = Payee.create({
        name: '  John Doe  ',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      expect(payee.name).toBe('John Doe');
    });
  });

  describe('equals', () => {
    it('should return true for same CPF payees', () => {
      const payee1 = Payee.create({
        name: 'John Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      const payee2 = Payee.create({
        name: 'Johnny Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      expect(payee1.equals(payee2)).toBe(true);
    });

    it('should return true for same CNPJ payees', () => {
      const payee1 = Payee.create({
        name: 'Company LLC',
        taxId: '12345678000195',
        taxIdType: 'CNPJ',
      });

      const payee2 = Payee.create({
        name: 'Company Inc',
        taxId: '12345678000195',
        taxIdType: 'CNPJ',
      });

      expect(payee1.equals(payee2)).toBe(true);
    });

    it('should return false for different CPF payees', () => {
      const payee1 = Payee.create({
        name: 'John Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      const payee2 = Payee.create({
        name: 'Jane Doe',
        taxId: '52998224725',
        taxIdType: 'CPF',
      });

      expect(payee1.equals(payee2)).toBe(false);
    });

    it('should return false when comparing CPF with CNPJ', () => {
      const payee1 = Payee.create({
        name: 'John Doe',
        taxId: '39053344705',
        taxIdType: 'CPF',
      });

      const payee2 = Payee.create({
        name: 'Company LLC',
        taxId: '12345678000195',
        taxIdType: 'CNPJ',
      });

      expect(payee1.equals(payee2)).toBe(false);
    });
  });
});
