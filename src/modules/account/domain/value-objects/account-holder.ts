import { cnpj } from 'cpf-cnpj-validator';
import { InvalidCnpjError } from '../errors/invalid-cnpj-error';
import { RequiredLegalNameError } from '../errors/required-legal-name-error';
import { RequiredTradeNameError } from '../errors/required-trade-name-error';

export interface AccountHolderProps {
  cnpj: string;
  legalName: string;
  tradeName: string;
}

export class AccountHolder {
  private readonly _cnpj: string;
  private readonly _legalName: string;
  private readonly _tradeName: string;

  private constructor(props: AccountHolderProps) {
    this._cnpj = props.cnpj;
    this._legalName = props.legalName;
    this._tradeName = props.tradeName;
  }

  public static create(props: AccountHolderProps): AccountHolder {
    const sanitizedCnpj = props.cnpj.replace(/[^\w]/g, '');

    if (!cnpj.isValid(sanitizedCnpj)) {
      throw new InvalidCnpjError();
    }

    const legalName = props.legalName.trim();
    const tradeName = props.tradeName.trim();

    if (!legalName) {
      throw new RequiredLegalNameError();
    }

    if (!tradeName) {
      throw new RequiredTradeNameError();
    }

    return new AccountHolder({
      cnpj: sanitizedCnpj,
      legalName,
      tradeName,
    });
  }

  get cnpj() {
    return this._cnpj;
  }

  get legalName() {
    return this._legalName;
  }

  get tradeName() {
    return this._tradeName;
  }

  public equals(other: AccountHolder): boolean {
    return (
      this._cnpj === other._cnpj &&
      this._legalName === other._legalName &&
      this._tradeName === other._tradeName
    );
  }
}
