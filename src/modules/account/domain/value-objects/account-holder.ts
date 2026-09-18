import { CNPJ } from '@/core/value-objects/cnpj';
import { RequiredLegalNameError } from '../errors/required-legal-name-error';
import { RequiredTradeNameError } from '../errors/required-trade-name-error';

export interface AccountHolderProps {
  cnpj: string;
  legalName: string;
  tradeName: string;
}

export class AccountHolder {
  private readonly _cnpj: CNPJ;
  private readonly _legalName: string;
  private readonly _tradeName: string;

  private constructor(cnpj: CNPJ, legalName: string, tradeName: string) {
    this._cnpj = cnpj;
    this._legalName = legalName;
    this._tradeName = tradeName;
    Object.freeze(this);
  }

  public static create(props: AccountHolderProps): AccountHolder {
    const cnpjOrError = CNPJ.create(props.cnpj);

    if (cnpjOrError.isLeft()) {
      throw cnpjOrError.value;
    }

    const legalName = props.legalName.trim();
    const tradeName = props.tradeName.trim();

    if (!legalName) {
      throw new RequiredLegalNameError();
    }

    if (!tradeName) {
      throw new RequiredTradeNameError();
    }

    return new AccountHolder(cnpjOrError.value, legalName, tradeName);
  }

  get cnpj(): string {
    return this._cnpj.value;
  }

  get cnpjVO(): CNPJ {
    return this._cnpj;
  }

  get legalName(): string {
    return this._legalName;
  }

  get tradeName(): string {
    return this._tradeName;
  }

  public equals(other: AccountHolder): boolean {
    return (
      this._cnpj.equals(other._cnpj) &&
      this._legalName === other._legalName &&
      this._tradeName === other._tradeName
    );
  }
}
