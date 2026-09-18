import { InsufficientFundsError } from '../errors/insufficient-funds-error';
import { InvalidAmountError } from '../errors/invalid-amount-error';

export class Money {
  private readonly _amountInCents: number;

  private constructor(amountInCents: number) {
    this._amountInCents = amountInCents;
  }

  public static create(amount: number): Money {
    if (amount < 0) {
      throw new InvalidAmountError();
    }
    const cents = Math.round(amount * 100);
    return new Money(cents);
  }

  public static fromCents(amountInCents: number): Money {
    if (!Number.isInteger(amountInCents) || amountInCents < 0) {
      throw new InvalidAmountError();
    }

    return new Money(amountInCents);
  }

  get value(): number {
    return this._amountInCents / 100;
  }

  get amountInCents(): number {
    return this._amountInCents;
  }

  public sum(other: Money): Money {
    return new Money(this._amountInCents + other._amountInCents);
  }

  public sub(other: Money): Money {
    if (other._amountInCents > this._amountInCents) {
      throw new InsufficientFundsError();
    }
    return new Money(this._amountInCents - other._amountInCents);
  }

  public isGreaterThan(other: Money): boolean {
    return this._amountInCents > other._amountInCents;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    return this._amountInCents >= other._amountInCents;
  }

  public equals(other: Money): boolean {
    return this._amountInCents === other._amountInCents;
  }
}
