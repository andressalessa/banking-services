import { InvalidEmailError } from '../errors/invalid-email-error';
import { Email } from './email';

describe('Email', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_123@sub.example.com',
        'test.email+filter@domain.co',
      ];

      validEmails.forEach((email) => {
        const result = Email.create(email);
        expect(result.isRight()).toBe(true);
      });
    });

    it('should fail with invalid email format', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach((email) => {
        const result = Email.create(email);
        expect(result.isLeft()).toBe(true);
      });
    });

    it('should fail when email exceeds 77 characters (PIX BACEN limit)', () => {
      const longEmail = 'a'.repeat(70) + '@test.com'; // > 77 chars

      const result = Email.create(longEmail);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidEmailError);
        expect(result.value.message).toContain('77 characters');
      }
    });

    it('should accept email with exactly 77 characters', () => {
      // Create email with exactly 77 chars: local@domain
      const email = 'a'.repeat(64) + '@example.com'; // 64 + 1 + 12 = 77

      const result = Email.create(email);

      expect(result.isRight()).toBe(true);
    });

    it('should be case insensitive', () => {
      const email1Result = Email.create('User@Example.COM');
      const email2Result = Email.create('user@example.com');

      expect(email1Result.isRight()).toBe(true);
      expect(email2Result.isRight()).toBe(true);

      if (email1Result.isRight() && email2Result.isRight()) {
        expect(email1Result.value.equals(email2Result.value)).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const result = Email.create('  user@example.com  ');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.value).toBe('user@example.com');
      }
    });

    it('should fail with empty email', () => {
      const result = Email.create('');

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal emails (case insensitive)', () => {
      const email1Result = Email.create('user@example.com');
      const email2Result = Email.create('USER@EXAMPLE.COM');

      expect(email1Result.isRight()).toBe(true);
      expect(email2Result.isRight()).toBe(true);

      if (email1Result.isRight() && email2Result.isRight()) {
        expect(email1Result.value.equals(email2Result.value)).toBe(true);
      }
    });

    it('should return false for different emails', () => {
      const email1Result = Email.create('user1@example.com');
      const email2Result = Email.create('user2@example.com');

      expect(email1Result.isRight()).toBe(true);
      expect(email2Result.isRight()).toBe(true);

      if (email1Result.isRight() && email2Result.isRight()) {
        expect(email1Result.value.equals(email2Result.value)).toBe(false);
      }
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal state', () => {
      const result = Email.create('user@example.com');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const email = result.value;

        // Attempt to modify should throw (Object is frozen)
        expect(() => {
          (email as any)._value = 'modified@example.com';
        }).toThrow();
      }
    });
  });
});
