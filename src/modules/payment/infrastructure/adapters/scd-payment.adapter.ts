import { Injectable } from '@nestjs/common';
import { right, Either } from '@/core/either';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentGatewayPort,
} from '../../application/ports/payment-gateway.port';

/**
 * SCD Payment Adapter (Mock Implementation)
 *
 * Implements PaymentGatewayPort for SCD (Sistema de Contas Digitais) provider.
 * This is a mock/fake adapter for testing and development.
 *
 * In production, this would:
 * - Call the real SCD REST API
 * - Handle authentication/authorization
 * - Implement retry logic
 * - Handle webhooks for async responses
 *
 * To swap payment providers:
 * 1. Create new adapter (e.g., StripePaymentAdapter)
 * 2. Implement PaymentGatewayPort
 * 3. Change provider in payment.module.ts
 * 4. Use cases remain unchanged (Dependency Inversion Principle)
 */
@Injectable()
export class ScdPaymentAdapter implements PaymentGatewayPort {
  async processPayment(
    request: PaymentRequest,
  ): Promise<Either<Error, PaymentResponse>> {
    // Mock: sempre retorna sucesso com transactionId gerado
    const transactionId = `tx-${Date.now()}-${request.expenseId.substring(0, 8)}`;

    const response: PaymentResponse = {
      transactionId,
    };

    return right(response);
  }
}
