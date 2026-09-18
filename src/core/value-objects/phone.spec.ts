import { InvalidPhoneError } from '../errors/invalid-phone-error';
import { Phone } from './phone';

describe('Phone', () => {
  describe('create', () => {
    it('should create valid E.164 phone', () => {
      const validPhones = [
        '+5511987654321', // Brazil mobile
        '+5511912345678',
        '+5521987654321',
        '+551133334444', // Brazil landline
        '+14155552671', // US
        '+442071234567', // UK
      ];

      validPhones.forEach((phone) => {
        const result = Phone.create(phone);
        expect(result.isRight()).toBe(true);
      });
    });

    it('should fail with invalid E.164 format', () => {
      const invalidPhones = [
        '11987654321', // missing +55
        '5511987654321', // missing +
        '+55119876543', // too few digits
        '+55 11 98765-4321', // with spaces/characters
        '(11) 98765-4321', // national format
        '+55119876543210', // too many digits for Brazil
      ];

      invalidPhones.forEach((phone) => {
        const result = Phone.create(phone);
        expect(result.isLeft()).toBe(true);
      });
    });

    it('should fail with invalid country code', () => {
      const result = Phone.create('+0011987654321'); // country code cannot start with 0

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPhoneError);
      }
    });

    it('should validate Brazilian phone length strictly', () => {
      // Valid: 13-14 characters total (+55 + 10-11 digits)
      const validBrazilian = [
        '+5511987654321', // 14 chars (mobile with 9)
        '+551133334444', // 13 chars (landline with 8)
      ];

      validBrazilian.forEach((phone) => {
        const result = Phone.create(phone);
        expect(result.isRight()).toBe(true);
      });

      // Invalid: wrong length for Brazil
      const invalidBrazilian = [
        '+55119876543', // 12 chars (too short)
        '+551198765432100', // 16 chars (too long)
      ];

      invalidBrazilian.forEach((phone) => {
        const result = Phone.create(phone);
        expect(result.isLeft()).toBe(true);
      });
    });

    it('should store phone without formatting', () => {
      const result = Phone.create('+5511987654321');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.value).toBe('+5511987654321');
      }
    });

    it('should trim whitespace', () => {
      const result = Phone.create('  +5511987654321  ');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.value).toBe('+5511987654321');
      }
    });

    it('should fail with empty phone', () => {
      const result = Phone.create('');

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal phones', () => {
      const phone1Result = Phone.create('+5511987654321');
      const phone2Result = Phone.create('+5511987654321');

      expect(phone1Result.isRight()).toBe(true);
      expect(phone2Result.isRight()).toBe(true);

      if (phone1Result.isRight() && phone2Result.isRight()) {
        expect(phone1Result.value.equals(phone2Result.value)).toBe(true);
      }
    });

    it('should return false for different phones', () => {
      const phone1Result = Phone.create('+5511987654321');
      const phone2Result = Phone.create('+5521987654321');

      expect(phone1Result.isRight()).toBe(true);
      expect(phone2Result.isRight()).toBe(true);

      if (phone1Result.isRight() && phone2Result.isRight()) {
        expect(phone1Result.value.equals(phone2Result.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal state', () => {
      const result = Phone.create('+5511987654321');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const phone = result.value;

        // Attempt to modify should throw (Object is frozen)
        expect(() => {
          (phone as any)._value = '+5521999999999';
        }).toThrow();
      }
    });
  });
});
