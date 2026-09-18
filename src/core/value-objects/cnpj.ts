import { cnpj as cnpjValidator } from 'cpf-cnpj-validator';
import { Either, left, right } from '../either';
import { InvalidCnpjError } from '../errors/invalid-cnpj-error';

export class CNPJ {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  public static create(value: string): Either<InvalidCnpjError, CNPJ> {
    const sanitized = value.replace(/\D/g, '');

    if (!cnpjValidator.isValid(sanitized)) {
      return left(new InvalidCnpjError());
    }

    return right(new CNPJ(sanitized));
  }

  get value(): string {
    return this._value;
  }

  public format(): string {
    return cnpjValidator.format(this._value);
  }

  public equals(other: CNPJ): boolean {
    return this._value === other._value;
  }
}
