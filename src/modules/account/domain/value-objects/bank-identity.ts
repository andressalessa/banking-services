export interface BankIdentityProps {
  externalAccountId: string;
  bankCode: string;
  branch: string;
  accountNumber: string;
}

export class BankIdentity {
  private readonly _externalAccountId: string;
  private readonly _bankCode: string;
  private readonly _branch: string;
  private readonly _accountNumber: string;

  private constructor(props: BankIdentityProps) {
    this._externalAccountId = props.externalAccountId;
    this._bankCode = props.bankCode;
    this._branch = props.branch;
    this._accountNumber = props.accountNumber;
  }

  public static create(props: BankIdentityProps): BankIdentity {
    const externalAccountId = props.externalAccountId.trim();
    const bankCode = props.bankCode.replace(/\D/g, '');
    const branch = props.branch.trim();
    const accountNumber = props.accountNumber.trim();

    if (!externalAccountId) {
      throw new Error('External account id is required.');
    }

    if (bankCode.length !== 3) {
      throw new Error('Invalid bank code.');
    }

    if (!branch) {
      throw new Error('Branch is required.');
    }

    if (!accountNumber) {
      throw new Error('Account number is required.');
    }

    return new BankIdentity({
      externalAccountId,
      bankCode,
      branch,
      accountNumber,
    });
  }

  get externalAccountId() {
    return this._externalAccountId;
  }

  get bankCode() {
    return this._bankCode;
  }

  get branch() {
    return this._branch;
  }

  get accountNumber() {
    return this._accountNumber;
  }

  public equals(other: BankIdentity): boolean {
    return (
      this._externalAccountId === other._externalAccountId &&
      this._bankCode === other._bankCode &&
      this._branch === other._branch &&
      this._accountNumber === other._accountNumber
    );
  }
}
