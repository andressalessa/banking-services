import { CPF } from '@/core/value-objects/cpf';
import { CNPJ } from '@/core/value-objects/cnpj';
import { Email } from '@/core/value-objects/email';

export type TaxIdType = 'CPF' | 'CNPJ';

export interface PayeeProps {
  name: string;
  taxId: string;
  taxIdType: TaxIdType;
  email?: string;
}

export class Payee {
  private readonly _name: string;
  private readonly _cpf?: CPF;
  private readonly _cnpj?: CNPJ;
  private readonly _email?: Email;

  private constructor(
    name: string,
    taxId: CPF | CNPJ,
    email?: Email,
  ) {
    this._name = name;
    if (taxId instanceof CPF) {
      this._cpf = taxId;
    } else {
      this._cnpj = taxId;
    }
    this._email = email;
    Object.freeze(this);
  }

  public static create(props: PayeeProps): Payee {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('Payee name must have at least 2 characters.');
    }

    let taxIdVO: CPF | CNPJ;

    if (props.taxIdType === 'CPF') {
      const cpfOrError = CPF.create(props.taxId);
      if (cpfOrError.isLeft()) {
        throw cpfOrError.value;
      }
      taxIdVO = cpfOrError.value;
    } else {
      const cnpjOrError = CNPJ.create(props.taxId);
      if (cnpjOrError.isLeft()) {
        throw cnpjOrError.value;
      }
      taxIdVO = cnpjOrError.value;
    }

    let emailVO: Email | undefined;
    if (props.email) {
      const emailOrError = Email.create(props.email);
      if (emailOrError.isLeft()) {
        throw emailOrError.value;
      }
      emailVO = emailOrError.value;
    }

    return new Payee(props.name.trim(), taxIdVO, emailVO);
  }

  get name(): string {
    return this._name;
  }

  get taxId(): string {
    return this._cpf ? this._cpf.value : this._cnpj!.value;
  }

  get taxIdType(): TaxIdType {
    return this._cpf ? 'CPF' : 'CNPJ';
  }

  get email(): string | undefined {
    return this._email?.value;
  }

  public equals(other: Payee): boolean {
    if (this._cpf && other._cpf) {
      return this._cpf.equals(other._cpf);
    }
    if (this._cnpj && other._cnpj) {
      return this._cnpj.equals(other._cnpj);
    }
    return false;
  }
}
