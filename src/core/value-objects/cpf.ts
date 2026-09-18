import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import { Either, left, right } from '../either';
import { InvalidCpfError } from '../errors/invalid-cpf-error';

export class CPF {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  public static create(value: string): Either<InvalidCpfError, CPF> {
    const sanitized = value.replace(/\D/g, '');

    if (!cpfValidator.isValid(sanitized)) {
      return left(new InvalidCpfError());
    }

    return right(new CPF(sanitized));
  }

  get value(): string {
    return this._value;
  }

  public format(): string {
    return cpfValidator.format(this._value);
  }

  public equals(other: CPF): boolean {
    return this._value === other._value;
  }
}
