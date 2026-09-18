import { Either, left, right } from '../either';
import { InvalidPhoneError } from '../errors/invalid-phone-error';

export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  public static create(value: string): Either<InvalidPhoneError, Phone> {
    const trimmed = value.trim();

    // E.164 format: +[country code][area code][number]
    // Example: +5511987654321 (Brazil mobile)
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (!e164Regex.test(trimmed)) {
      return left(new InvalidPhoneError('Phone must be in E.164 format (e.g., +5511987654321).'));
    }

    // Validate Brazil phone numbers more strictly
    if (trimmed.startsWith('+55')) {
      // +55 (country) + 2 digits (area code) + 8-9 digits (number)
      // Total: +55 + 10-11 digits = 13-14 characters
      if (trimmed.length < 13 || trimmed.length > 14) {
        return left(new InvalidPhoneError('Brazilian phone must have 13-14 characters in E.164 format.'));
      }
    }

    return right(new Phone(trimmed));
  }

  get value(): string {
    return this._value;
  }

  public equals(other: Phone): boolean {
    return this._value === other._value;
  }
}
