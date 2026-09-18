import { PrismaPaymentDetailsMapper } from './prisma-payment-details.mapper';
import { PaymentDetails } from '@/modules/payment/domain/value-objects/payment-details';

const BOLETO_BARCODE = '23793381286000000005325000063304684800000010000';

describe('PrismaPaymentDetailsMapper', () => {
  describe('toDomain', () => {
    it('should convert PIX JSON to PaymentDetails', () => {
      const details = PrismaPaymentDetailsMapper.toDomain({
        method: 'PIX',
        pixKey: 'test@example.com',
        pixKeyType: 'EMAIL',
      });

      expect(details.isPix()).toBe(true);
      expect(details.pixKey).toBe('test@example.com');
    });

    it('should convert BOLETO JSON to PaymentDetails', () => {
      const details = PrismaPaymentDetailsMapper.toDomain({
        method: 'BOLETO',
        barCode: BOLETO_BARCODE,
      });

      expect(details.isBoleto()).toBe(true);
      expect(details.details).toMatchObject({
        method: 'BOLETO',
        barCode: BOLETO_BARCODE,
      });
    });

    it('should convert BANK_TRANSFER JSON to PaymentDetails', () => {
      const details = PrismaPaymentDetailsMapper.toDomain({
        method: 'BANK_TRANSFER',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
        accountType: 'CHECKING',
      });

      expect(details.isBankTransfer()).toBe(true);
    });

    it('should throw on unknown payment method', () => {
      expect(() =>
        PrismaPaymentDetailsMapper.toDomain({ method: 'CRYPTO' }),
      ).toThrow(/Unknown or invalid payment details/);
    });
  });

  describe('toPrisma', () => {
    it('should serialize PIX details as JSON', () => {
      const details = PaymentDetails.createPix('test@example.com');

      expect(PrismaPaymentDetailsMapper.toPrisma(details)).toEqual({
        method: 'PIX',
        pixKey: 'test@example.com',
        pixKeyType: 'EMAIL',
      });
    });
  });
});
