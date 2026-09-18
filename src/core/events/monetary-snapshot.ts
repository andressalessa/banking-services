import type { Money } from '../value-objects/money';

/**
 * Monetary Snapshot - Integration Contract
 *
 * This is a Published Language construct for integration between Bounded Contexts.
 * It represents monetary values in domain events, ensuring a stable contract
 * for cross-context communication and future microservices extraction.
 *
 * This is NOT part of the Money value object domain model, but rather
 * a serialization format for events.
 */

export const BRL = 'BRL' as const;

export type MonetarySnapshot = {
  valueInCents: number;
  currency: typeof BRL;
};

/**
 * Converts a Money value object to a MonetarySnapshot for event payloads.
 *
 * This function lives in the events layer (Shared Kernel) because it's part
 * of the integration contract, not the domain model of money itself.
 */
export function toMonetarySnapshot(money: Money): MonetarySnapshot {
  return {
    valueInCents: money.amountInCents,
    currency: BRL,
  };
}
