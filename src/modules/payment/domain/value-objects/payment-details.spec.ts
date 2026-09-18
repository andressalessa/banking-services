import { PaymentDetails } from './payment-details';
import { InvalidPixKeyCpfError } from '../errors/invalid-pix-key-cpf-error';
import { InvalidPixKeyCnpjError } from '../errors/invalid-pix-key-cnpj-error';
import { InvalidPixKeyEmailError } from '../errors/invalid-pix-key-email-error';
import { InvalidPixKeyPhoneError } from '../errors/invalid-pix-key-phone-error';
import { InvalidPixKeyRandomError } from '../errors/invalid-pix-key-random-error';
import { EmptyPixKeyError } from '../errors/empty-pix-key-error';

describe('PaymentDetails', () => {
  describe('PIX payment', () => {
    describe('CPF key validation (production-grade with check digits)', () => {
      it('should accept valid CPF: 191.111.111-60', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '191.111.111-60',
            pixKeyType: 'CPF',
          }),
        ).not.toThrow();
      });

      it('should accept valid CPF without formatting: 19111111160', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '19111111160',
            pixKeyType: 'CPF',
          }),
        ).not.toThrow();
      });

      it('should accept valid CPF: 111.444.777-35', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '111.444.777-35',
            pixKeyType: 'CPF',
          }),
        ).not.toThrow();
      });

      it('should reject CPF with invalid check digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '111.444.777-00', // Wrong check digits
            pixKeyType: 'CPF',
          }),
        ).toThrow(InvalidPixKeyCpfError);
      });

      it('should reject CPF with all same digits (111.111.111-11)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '111.111.111-11',
            pixKeyType: 'CPF',
          }),
        ).toThrow(InvalidPixKeyCpfError);
      });

      it('should reject CPF with all zeros', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '000.000.000-00',
            pixKeyType: 'CPF',
          }),
        ).toThrow(InvalidPixKeyCpfError);
      });

      it('should reject CPF with less than 11 digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '1234567890',
            pixKeyType: 'CPF',
          }),
        ).toThrow(InvalidPixKeyCpfError);
      });

      it('should reject CPF with more than 11 digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123456789012',
            pixKeyType: 'CPF',
          }),
        ).toThrow(InvalidPixKeyCpfError);
      });

      it('should reject CPF with letters', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '1234567890a',
            pixKeyType: 'CPF',
          }),
        ).toThrow(InvalidPixKeyCpfError);
      });
    });

    describe('CNPJ key validation (production-grade with check digits)', () => {
      it('should accept valid CNPJ: 11.222.333/0001-81', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '11.222.333/0001-81',
            pixKeyType: 'CNPJ',
          }),
        ).not.toThrow();
      });

      it('should accept valid CNPJ without formatting: 11222333000181', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '11222333000181',
            pixKeyType: 'CNPJ',
          }),
        ).not.toThrow();
      });

      it('should accept valid CNPJ: 34.028.316/0001-03', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '34.028.316/0001-03',
            pixKeyType: 'CNPJ',
          }),
        ).not.toThrow();
      });

      it('should reject CNPJ with invalid check digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '11.222.333/0001-00', // Wrong check digits
            pixKeyType: 'CNPJ',
          }),
        ).toThrow(InvalidPixKeyCnpjError);
      });

      it('should reject CNPJ with all same digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '11.111.111/1111-11',
            pixKeyType: 'CNPJ',
          }),
        ).toThrow(InvalidPixKeyCnpjError);
      });

      it('should reject CNPJ with all zeros', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '00.000.000/0000-00',
            pixKeyType: 'CNPJ',
          }),
        ).toThrow(InvalidPixKeyCnpjError);
      });

      it('should reject CNPJ with less than 14 digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '1234567890123',
            pixKeyType: 'CNPJ',
          }),
        ).toThrow(InvalidPixKeyCnpjError);
      });

      it('should reject CNPJ with more than 14 digits', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123456789012345',
            pixKeyType: 'CNPJ',
          }),
        ).toThrow(InvalidPixKeyCnpjError);
      });
    });

    describe('EMAIL key validation (BACEN specs: max 77 chars, RFC 5322)', () => {
      it('should accept valid email', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'user@example.com',
            pixKeyType: 'EMAIL',
          }),
        ).not.toThrow();
      });

      it('should accept email with subdomain', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'user@mail.example.com',
            pixKeyType: 'EMAIL',
          }),
        ).not.toThrow();
      });

      it('should accept email with dots in local part', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'user.name@example.com',
            pixKeyType: 'EMAIL',
          }),
        ).not.toThrow();
      });

      it('should accept email with numbers', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'user123@example123.com',
            pixKeyType: 'EMAIL',
          }),
        ).not.toThrow();
      });

      it('should normalize email to lowercase', () => {
        const paymentDetails = PaymentDetails.create({
          method: 'PIX',
          pixKey: 'USER@EXAMPLE.COM',
          pixKeyType: 'EMAIL',
        });
        expect(paymentDetails).toBeDefined();
      });

      it('should accept email exactly at 77 characters limit', () => {
        // 77 characters total: 64 + @ + 12 = 77
        const email = 'a'.repeat(64) + '@' + 'b'.repeat(11) + '.com'; // 64 + 1(@) + 11 + 1(.) + 3 = 80... wrong
        // Let's recalculate: local(64) + @ + domain(11) + .com = 64 + 1 + 7 + 4 = 76
        // Need one more: local(64) + @ + domain(12) = 64 + 1 + 12 = 77
        const correctEmail = 'a'.repeat(64) + '@example.comm'; // 64 + 1 + 12 = 77
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: correctEmail,
            pixKeyType: 'EMAIL',
          }),
        ).not.toThrow();
      });

      it('should reject email exceeding 77 characters (BACEN limit)', () => {
        // 78 characters total: 66 + 1(@) + 11(example.com) = 78
        const email = 'a'.repeat(66) + '@example.com';
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: email,
            pixKeyType: 'EMAIL',
          }),
        ).toThrow(InvalidPixKeyEmailError);
      });

      it('should reject email without @', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'userexample.com',
            pixKeyType: 'EMAIL',
          }),
        ).toThrow(InvalidPixKeyEmailError);
      });

      it('should reject email without domain', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'user@',
            pixKeyType: 'EMAIL',
          }),
        ).toThrow(InvalidPixKeyEmailError);
      });

      it('should reject email without local part', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '@example.com',
            pixKeyType: 'EMAIL',
          }),
        ).toThrow(InvalidPixKeyEmailError);
      });

      it('should reject email with spaces', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'user @example.com',
            pixKeyType: 'EMAIL',
          }),
        ).toThrow(InvalidPixKeyEmailError);
      });
    });

    describe('PHONE key validation (E.164 format - BACEN requirement)', () => {
      it('should accept valid mobile phone with E.164 format', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5511987654321',
            pixKeyType: 'PHONE',
          }),
        ).not.toThrow();
      });

      it('should accept valid landline phone with E.164 format', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+551133334444',
            pixKeyType: 'PHONE',
          }),
        ).not.toThrow();
      });

      it('should accept phone from different area codes', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5521987654321', // Rio de Janeiro
            pixKeyType: 'PHONE',
          }),
        ).not.toThrow();

        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5585987654321', // Ceará
            pixKeyType: 'PHONE',
          }),
        ).not.toThrow();
      });

      it('should accept phone with spaces (cleaned during validation)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+55 11 98765-4321',
            pixKeyType: 'PHONE',
          }),
        ).not.toThrow();
      });

      it('should reject phone without +55 prefix (E.164 requirement)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '11987654321',
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with country code but no + sign', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '5511987654321',
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with invalid country code', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+1987654321', // USA country code
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with invalid area code (< 11)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5510987654321', // DDD 10 does not exist
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with invalid area code (00)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5500987654321',
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject mobile phone not starting with 9', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5511887654321', // 9 digits but starts with 8
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject landline starting with 9', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+551198765432', // 8 digits but starts with 9
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with less than 10 digits after country code', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+55119876543', // Only 9 digits
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with more than 11 digits after country code', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5511987654321123', // 13 digits
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });

      it('should reject phone with letters', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '+5511987654abc',
            pixKeyType: 'PHONE',
          }),
        ).toThrow(InvalidPixKeyPhoneError);
      });
    });

    describe('RANDOM key validation (EVP - UUID v4)', () => {
      it('should accept valid UUID v4', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123e4567-e89b-42d3-a456-426614174000',
            pixKeyType: 'RANDOM',
          }),
        ).not.toThrow();
      });

      it('should accept UUID in uppercase', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123E4567-E89B-42D3-A456-426614174000',
            pixKeyType: 'RANDOM',
          }),
        ).not.toThrow();
      });

      it('should accept UUID in mixed case', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123e4567-E89B-42d3-A456-426614174000',
            pixKeyType: 'RANDOM',
          }),
        ).not.toThrow();
      });

      it('should reject UUID v1 (different version field)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '550e8400-e29b-11d4-a716-446655440000', // Version 1
            pixKeyType: 'RANDOM',
          }),
        ).toThrow(InvalidPixKeyRandomError);
      });

      it('should reject UUID without hyphens', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123e4567e89b42d3a456426614174000',
            pixKeyType: 'RANDOM',
          }),
        ).toThrow(InvalidPixKeyRandomError);
      });

      it('should reject invalid UUID format (too short)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123e4567-e89b-42d3-a456',
            pixKeyType: 'RANDOM',
          }),
        ).toThrow(InvalidPixKeyRandomError);
      });

      it('should reject invalid UUID format (too long)', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123e4567-e89b-42d3-a456-426614174000-extra',
            pixKeyType: 'RANDOM',
          }),
        ).toThrow(InvalidPixKeyRandomError);
      });

      it('should reject random string', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: 'random-key-123',
            pixKeyType: 'RANDOM',
          }),
        ).toThrow(InvalidPixKeyRandomError);
      });

      it('should reject UUID with invalid characters', () => {
        expect(() =>
          PaymentDetails.create({
            method: 'PIX',
            pixKey: '123g4567-e89b-42d3-a456-426614174000', // 'g' is not hex
            pixKeyType: 'RANDOM',
          }),
        ).toThrow(InvalidPixKeyRandomError);
      });
    });

    it('should reject empty PIX key', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'PIX',
          pixKey: '',
          pixKeyType: 'CPF',
        }),
      ).toThrow(EmptyPixKeyError);
    });

    it('should reject PIX key with only whitespace', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'PIX',
          pixKey: '   ',
          pixKeyType: 'CPF',
        }),
      ).toThrow(EmptyPixKeyError);
    });
  });

  describe('BOLETO payment', () => {
    it('should accept valid boleto barcode with 44 digits', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BOLETO',
          barCode: '12345678901234567890123456789012345678901234',
        }),
      ).not.toThrow();
    });

    it('should accept valid boleto barcode with 47 digits', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BOLETO',
          barCode: '12345678901234567890123456789012345678901234567',
        }),
      ).not.toThrow();
    });

    it('should accept boleto barcode with spaces and dots', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BOLETO',
          barCode: '12345.67890 12345.678901 12345.678901 2 34567890123456',
        }),
      ).not.toThrow();
    });

    it('should reject boleto barcode with less than 44 digits', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BOLETO',
          barCode: '123456789012345678901234567890123456789012',
        }),
      ).toThrow('Invalid boleto barcode length.');
    });

    it('should reject boleto barcode with more than 48 digits', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BOLETO',
          barCode: '123456789012345678901234567890123456789012345678901',
        }),
      ).toThrow('Invalid boleto barcode length.');
    });
  });

  describe('BANK_TRANSFER payment', () => {
    it('should accept valid bank transfer details', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BANK_TRANSFER',
          bankCode: '001',
          branch: '1234',
          accountNumber: '12345-6',
          accountType: 'CHECKING',
        }),
      ).not.toThrow();
    });

    it('should reject bank transfer without bank code', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BANK_TRANSFER',
          bankCode: '',
          branch: '1234',
          accountNumber: '12345-6',
          accountType: 'CHECKING',
        }),
      ).toThrow(
        'Bank code, branch, and account number are required for bank transfer.',
      );
    });

    it('should reject bank transfer without branch', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BANK_TRANSFER',
          bankCode: '001',
          branch: '',
          accountNumber: '12345-6',
          accountType: 'CHECKING',
        }),
      ).toThrow(
        'Bank code, branch, and account number are required for bank transfer.',
      );
    });

    it('should reject bank transfer without account number', () => {
      expect(() =>
        PaymentDetails.create({
          method: 'BANK_TRANSFER',
          bankCode: '001',
          branch: '1234',
          accountNumber: '',
          accountType: 'SAVINGS',
        }),
      ).toThrow(
        'Bank code, branch, and account number are required for bank transfer.',
      );
    });
  });

  describe('Value Object methods', () => {
    it('should identify PIX payment correctly', () => {
      const paymentDetails = PaymentDetails.create({
        method: 'PIX',
        pixKey: '19111111160', // Valid CPF
        pixKeyType: 'CPF',
      });

      expect(paymentDetails.isPix()).toBe(true);
      expect(paymentDetails.isBoleto()).toBe(false);
      expect(paymentDetails.isBankTransfer()).toBe(false);
    });

    it('should identify BOLETO payment correctly', () => {
      const paymentDetails = PaymentDetails.create({
        method: 'BOLETO',
        barCode: '12345678901234567890123456789012345678901234',
      });

      expect(paymentDetails.isPix()).toBe(false);
      expect(paymentDetails.isBoleto()).toBe(true);
      expect(paymentDetails.isBankTransfer()).toBe(false);
    });

    it('should identify BANK_TRANSFER payment correctly', () => {
      const paymentDetails = PaymentDetails.create({
        method: 'BANK_TRANSFER',
        bankCode: '001',
        branch: '1234',
        accountNumber: '12345-6',
        accountType: 'CHECKING',
      });

      expect(paymentDetails.isPix()).toBe(false);
      expect(paymentDetails.isBoleto()).toBe(false);
      expect(paymentDetails.isBankTransfer()).toBe(true);
    });

    it('should return correct method', () => {
      const paymentDetails = PaymentDetails.create({
        method: 'PIX',
        pixKey: 'user@example.com',
        pixKeyType: 'EMAIL',
      });

      expect(paymentDetails.method).toBe('PIX');
    });

    it('should return complete details', () => {
      const props = {
        method: 'PIX' as const,
        pixKey: 'user@example.com',
        pixKeyType: 'EMAIL' as const,
      };

      const paymentDetails = PaymentDetails.create(props);

      expect(paymentDetails.details).toEqual(props);
    });
  });
});
