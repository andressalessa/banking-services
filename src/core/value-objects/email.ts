import { Either, left, right } from '../either';
import { InvalidEmailError } from '../errors/invalid-email-error';

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  public static create(value: string): Either<InvalidEmailError, Email> {
    const trimmed = value.trim().toLowerCase();

    // RFC 5322 Email Regex (simplified but compliant, requires TLD)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(trimmed)) {
      return left(new InvalidEmailError('Invalid email format.'));
    }

    // PIX BACEN limit: max 77 characters
    if (trimmed.length > 77) {
      return left(new InvalidEmailError('Email exceeds 77 characters (PIX BACEN limit).'));
    }

    return right(new Email(trimmed));
  }

  get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }
}
