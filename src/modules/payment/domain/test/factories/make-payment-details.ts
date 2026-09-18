import { PaymentDetails } from '../../value-objects/payment-details';

export function makePaymentDetails(pixKey: string = 'test@example.com'): PaymentDetails {
  return PaymentDetails.createPix(pixKey);
}
