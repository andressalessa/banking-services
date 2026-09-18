import { InsufficientFundsError } from '../errors/insufficient-funds-error';
import { InvalidAmountError } from '../errors/invalid-amount-error';
import { Money } from './money';

describe('Money', () => {
  it('should be able to create a money', () => {
    const money = Money.create(100);
    expect(money).toBeDefined();
  });

  it('should create a valid money object from decimal amount', () => {
    const money = Money.create(100.5);
    expect(money.value).toBe(100.5);
  });

  it('should throw an error if the amount is negative', () => {
    expect(() => Money.create(-100)).toThrow(new InvalidAmountError());
  });

  it('should throw an error if the amount is insufficient', () => {
    const money = Money.create(100);
    expect(() => money.sub(Money.create(101))).toThrow(
      new InsufficientFundsError(),
    );
  });

  it('should be able to sum two money objects', () => {
    const money = Money.create(100);
    const money2 = Money.create(100);
    expect(money.sum(money2).value).toBe(200);
  });

  it('should be able to subtract two money objects', () => {
    const money = Money.create(100);
    const money2 = Money.create(100);
    expect(money.sub(money2).value).toBe(0);
  });

  it('should be able to compare two money objects', () => {
    const money = Money.create(100);
    const money2 = Money.create(100);
    expect(money.equals(money2)).toBe(true);
  });

  it('should create money from cents', () => {
    const money = Money.fromCents(10050);

    expect(money.value).toBe(100.5);
    expect(money.amountInCents).toBe(10050);
  });

  it('should throw when creating money from negative cents', () => {
    expect(() => Money.fromCents(-1)).toThrow(new InvalidAmountError());
  });

  describe('operations', () => {
    it('should multiply money by positive factor', () => {
      const money = Money.create(100);
      const result = money.multiply(2.5);

      expect(result.value).toBe(250);
    });

    it('should throw when multiplying by negative factor', () => {
      const money = Money.create(100);

      expect(() => money.multiply(-2)).toThrow(new InvalidAmountError());
    });

    it('should divide money by positive divisor', () => {
      const money = Money.create(100);
      const result = money.divide(4);

      expect(result.value).toBe(25);
    });

    it('should throw when dividing by zero', () => {
      const money = Money.create(100);

      expect(() => money.divide(0)).toThrow(new InvalidAmountError());
    });

    it('should throw when dividing by negative divisor', () => {
      const money = Money.create(100);

      expect(() => money.divide(-2)).toThrow(new InvalidAmountError());
    });
  });

  describe('comparisons', () => {
    it('should compare if money is greater than another', () => {
      const money1 = Money.create(100);
      const money2 = Money.create(50);

      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should compare if money is greater than or equal to another', () => {
      const money1 = Money.create(100);
      const money2 = Money.create(100);
      const money3 = Money.create(50);

      expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
      expect(money1.isGreaterThanOrEqual(money3)).toBe(true);
      expect(money3.isGreaterThanOrEqual(money1)).toBe(false);
    });

    it('should compare if money is less than another', () => {
      const money1 = Money.create(50);
      const money2 = Money.create(100);

      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(false);
    });

    it('should compare if money is less than or equal to another', () => {
      const money1 = Money.create(100);
      const money2 = Money.create(100);
      const money3 = Money.create(150);

      expect(money1.isLessThanOrEqual(money2)).toBe(true);
      expect(money1.isLessThanOrEqual(money3)).toBe(true);
      expect(money3.isLessThanOrEqual(money1)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not modify original instance in operations', () => {
      const original = Money.create(100);
      const added = original.sum(Money.create(50));
      const subtracted = original.sub(Money.create(20));
      const multiplied = original.multiply(2);
      const divided = original.divide(2);

      expect(original.value).toBe(100); // unchanged
      expect(added.value).toBe(150);
      expect(subtracted.value).toBe(80);
      expect(multiplied.value).toBe(200);
      expect(divided.value).toBe(50);
    });
  });
});
