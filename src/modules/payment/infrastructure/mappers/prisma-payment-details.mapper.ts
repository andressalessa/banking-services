import {
  PaymentDetails,
  PaymentDetailsProps,
} from '@/modules/payment/domain/value-objects/payment-details';

export type PaymentDetailsJson = PaymentDetailsProps;

function isPaymentDetailsJson(raw: unknown): raw is PaymentDetailsJson {
  if (typeof raw !== 'object' || raw === null || !('method' in raw)) {
    return false;
  }

  const method = (raw as { method: unknown }).method;
  return (
    method === 'PIX' || method === 'BOLETO' || method === 'BANK_TRANSFER'
  );
}

export class PrismaPaymentDetailsMapper {
  static toDomain(raw: unknown): PaymentDetails {
    if (!isPaymentDetailsJson(raw)) {
      throw new Error(
        `Unknown or invalid payment details in database: ${JSON.stringify(raw)}`,
      );
    }

    switch (raw.method) {
      case 'PIX':
        return PaymentDetails.create({
          method: 'PIX',
          pixKey: raw.pixKey,
          pixKeyType: raw.pixKeyType,
        });
      case 'BOLETO':
        return PaymentDetails.create({
          method: 'BOLETO',
          barCode: raw.barCode,
        });
      case 'BANK_TRANSFER':
        return PaymentDetails.create({
          method: 'BANK_TRANSFER',
          bankCode: raw.bankCode,
          branch: raw.branch,
          accountNumber: raw.accountNumber,
          accountType: raw.accountType,
        });
      default: {
        const exhaustive: never = raw;
        throw new Error(
          `Unknown payment method in database: ${JSON.stringify(exhaustive)}`,
        );
      }
    }
  }

  static toPrisma(paymentDetails: PaymentDetails): PaymentDetailsJson {
    return paymentDetails.details;
  }
}
