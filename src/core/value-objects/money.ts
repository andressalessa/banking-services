export class Money {
  private readonly _amountInCents: number;

  private constructor(amountInCents: number) {
    this._amountInCents = amountInCents;
  }

  public static create(amount: number): Money {
    if (amount < 0) {
      throw new Error('Monetary amount cannot be negative.');
    }
    const cents = Math.round(amount * 100);
    return new Money(cents);
  }

  get value(): number {
    return this._amountInCents / 100;
  }

  public sum(other: Money): Money {
    return new Money(this._amountInCents + other._amountInCents);
  }

  public sub(other: Money): Money {
    if (other._amountInCents > this._amountInCents) {
      throw new Error('Insufficient funds for this operation.');
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
