import { InvalidCnpjError } from '../errors/invalid-cnpj-error';
import { CNPJ } from './cnpj';

describe('CNPJ', () => {
  describe('create', () => {
    it('should create valid CNPJ without mask', () => {
      const result = CNPJ.create('12345678000195');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cnpj = result.value;
        expect(cnpj.value).toBe('12345678000195');
      }
    });

    it('should create valid CNPJ with mask', () => {
      const result = CNPJ.create('12.345.678/0001-95');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cnpj = result.value;
        expect(cnpj.value).toBe('12345678000195');
      }
    });

    it('should fail with invalid CNPJ (wrong check digits)', () => {
      const result = CNPJ.create('12345678000100'); // wrong check digits

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidCnpjError);
      }
    });

    it('should fail with CNPJ containing all same digits', () => {
      const invalidCnpjs = [
        '11111111111111',
        '22222222222222',
        '00000000000000',
      ];

      invalidCnpjs.forEach((cnpj) => {
        const result = CNPJ.create(cnpj);
        expect(result.isLeft()).toBe(true);
      });
    });

    it('should fail with CNPJ with wrong length', () => {
      const result = CNPJ.create('123456780001'); // 12 digits

      expect(result.isLeft()).toBe(true);
    });

    it('should fail with empty CNPJ', () => {
      const result = CNPJ.create('');

      expect(result.isLeft()).toBe(true);
    });

    it('should fail with CNPJ containing letters', () => {
      const result = CNPJ.create('1234567800019A');

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('format', () => {
    it('should format CNPJ with mask', () => {
      const result = CNPJ.create('12345678000195');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cnpj = result.value;
        expect(cnpj.format()).toBe('12.345.678/0001-95');
      }
    });
  });

  describe('equals', () => {
    it('should return true for equal CNPJs', () => {
      const cnpj1Result = CNPJ.create('12345678000195');
      const cnpj2Result = CNPJ.create('12.345.678/0001-95');

      expect(cnpj1Result.isRight()).toBe(true);
      expect(cnpj2Result.isRight()).toBe(true);

      if (cnpj1Result.isRight() && cnpj2Result.isRight()) {
        expect(cnpj1Result.value.equals(cnpj2Result.value)).toBe(true);
      }
    });

    it('should return false for different CNPJs', () => {
      const cnpj1Result = CNPJ.create('12345678000195');
      const cnpj2Result = CNPJ.create('11222333000181'); // Different valid CNPJ

      expect(cnpj1Result.isRight()).toBe(true);
      expect(cnpj2Result.isRight()).toBe(true);

      if (cnpj1Result.isRight() && cnpj2Result.isRight()) {
        expect(cnpj1Result.value.equals(cnpj2Result.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal state', () => {
      const result = CNPJ.create('12345678000195');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cnpj = result.value;

        // Attempt to modify should throw (Object is frozen)
        expect(() => {
          (cnpj as any)._value = '00000000000000';
        }).toThrow();
      }
    });
  });
});
