import { Either } from '@/core/either';

export interface PaymentRequest {
  expenseId: string;
  accountId: string;
  amount: number;
  payee: {
    name: string;
    taxId: string;
  };
  paymentDetails: {
    method: string;
    pixKey?: string;
  };
}

export interface PaymentResponse {
  transactionId: string;
}

/**
 * Payment Gateway Port (Hexagonal Architecture)
 *
 * Generic port for payment processing capabilities.
 * Decouples domain from specific payment providers (SCD, Stripe, Adyen, etc).
 *
 * Adapters implement this interface:
 * - ScdPaymentAdapter (current implementation)
 * - StripePaymentAdapter (future)
 * - AdyenPaymentAdapter (future)
 *
 * Following Dependency Inversion Principle (DIP):
 * - Use Cases depend on this abstraction, not concrete implementations
 * - Easy to swap payment providers by changing adapter in DI container
 */
export abstract class PaymentGatewayPort {
  abstract processPayment(
    request: PaymentRequest,
  ): Promise<Either<Error, PaymentResponse>>;
}
