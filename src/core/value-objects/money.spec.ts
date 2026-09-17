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
});
