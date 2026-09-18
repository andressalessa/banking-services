import { Money } from '../value-objects/money';
import { toMonetarySnapshot, MonetarySnapshot, BRL } from './monetary-snapshot';

describe('MonetarySnapshot', () => {
  describe('toMonetarySnapshot', () => {
    it('should convert Money to MonetarySnapshot', () => {
      const money = Money.fromCents(10050);
      const snapshot = toMonetarySnapshot(money);

      expect(snapshot).toEqual({
        valueInCents: 10050,
        currency: 'BRL',
      });
    });

    it('should preserve exact cent values', () => {
      const money = Money.create(99.99);
      const snapshot = toMonetarySnapshot(money);

      expect(snapshot.valueInCents).toBe(9999);
      expect(snapshot.currency).toBe(BRL);
    });

    it('should handle zero amounts', () => {
      const money = Money.create(0);
      const snapshot = toMonetarySnapshot(money);

      expect(snapshot).toEqual({
        valueInCents: 0,
        currency: 'BRL',
      });
    });

    it('should create a plain object (not a class instance)', () => {
      const money = Money.create(100);
      const snapshot = toMonetarySnapshot(money);

      expect(typeof snapshot).toBe('object');
      expect(snapshot.constructor).toBe(Object);
      expect(snapshot).not.toBeInstanceOf(Money);
    });

    it('should match the MonetarySnapshot type contract', () => {
      const money = Money.fromCents(5000);
      const snapshot: MonetarySnapshot = toMonetarySnapshot(money);

      // Type assertion - if this compiles, the contract is correct
      expect(snapshot.valueInCents).toBeDefined();
      expect(snapshot.currency).toBeDefined();
      expect(typeof snapshot.valueInCents).toBe('number');
      expect(typeof snapshot.currency).toBe('string');
    });

    it('should always use BRL currency', () => {
      const amounts = [0, 1, 100, 1000.50, 999999.99];

      amounts.forEach((amount) => {
        const money = Money.create(amount);
        const snapshot = toMonetarySnapshot(money);

        expect(snapshot.currency).toBe('BRL');
        expect(snapshot.currency).toBe(BRL);
      });
    });

    it('should be suitable for event payloads (serializable)', () => {
      const money = Money.create(250.75);
      const snapshot = toMonetarySnapshot(money);

      // Should be JSON serializable
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(snapshot);
      expect(parsed.valueInCents).toBe(25075);
      expect(parsed.currency).toBe('BRL');
    });
  });
});
