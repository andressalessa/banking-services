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
    const cnpj = props.cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      throw new Error('Invalid CNPJ.');
    }

    const legalName = props.legalName.trim();
    const tradeName = props.tradeName.trim();

    if (!legalName) {
      throw new Error('Legal name is required.');
    }

    if (!tradeName) {
      throw new Error('Trade name is required.');
    }

    return new AccountHolder({
      cnpj,
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
