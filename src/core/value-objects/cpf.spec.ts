import { InvalidCpfError } from '../errors/invalid-cpf-error';
import { CPF } from './cpf';

describe('CPF', () => {
  describe('create', () => {
    it('should create valid CPF without mask', () => {
      const result = CPF.create('39053344705'); // Valid CPF

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cpf = result.value;
        expect(cpf.value).toBe('39053344705');
      }
    });

    it('should create valid CPF with mask', () => {
      const result = CPF.create('390.533.447-05');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cpf = result.value;
        expect(cpf.value).toBe('39053344705'); // stores without mask
      }
    });

    it('should fail with invalid CPF (wrong check digits)', () => {
      const result = CPF.create('12345678900'); // wrong check digits

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidCpfError);
      }
    });

    it('should fail with CPF containing all same digits', () => {
      const invalidCpfs = [
        '11111111111',
        '22222222222',
        '33333333333',
        '00000000000',
        '99999999999',
      ];

      invalidCpfs.forEach((cpf) => {
        const result = CPF.create(cpf);
        expect(result.isLeft()).toBe(true);
      });
    });

    it('should fail with CPF containing letters', () => {
      const result = CPF.create('123456789AB');

      expect(result.isLeft()).toBe(true);
    });

    it('should fail with CPF with wrong length', () => {
      const result = CPF.create('1234567890'); // 10 digits

      expect(result.isLeft()).toBe(true);
    });

    it('should fail with empty CPF', () => {
      const result = CPF.create('');

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('format', () => {
    it('should format CPF with mask', () => {
      const result = CPF.create('39053344705');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cpf = result.value;
        expect(cpf.format()).toBe('390.533.447-05');
      }
    });
  });

  describe('equals', () => {
    it('should return true for equal CPFs', () => {
      const cpf1Result = CPF.create('39053344705');
      const cpf2Result = CPF.create('390.533.447-05');

      expect(cpf1Result.isRight()).toBe(true);
      expect(cpf2Result.isRight()).toBe(true);

      if (cpf1Result.isRight() && cpf2Result.isRight()) {
        expect(cpf1Result.value.equals(cpf2Result.value)).toBe(true);
      }
    });

    it('should return false for different CPFs', () => {
      const cpf1Result = CPF.create('39053344705');
      const cpf2Result = CPF.create('52998224725'); // Different valid CPF

      expect(cpf1Result.isRight()).toBe(true);
      expect(cpf2Result.isRight()).toBe(true);

      if (cpf1Result.isRight() && cpf2Result.isRight()) {
        expect(cpf1Result.value.equals(cpf2Result.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal state', () => {
      const result = CPF.create('39053344705');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const cpf = result.value;

        // Attempt to modify should throw (Object is frozen)
        expect(() => {
          (cpf as any)._value = '00000000000';
        }).toThrow();
      }
    });
  });
});
