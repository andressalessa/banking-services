export type TaxIdType = 'CPF' | 'CNPJ';

export interface PayeeProps {
  name: string;
  taxId: string;
  taxIdType: TaxIdType;
  email?: string;
}

export class Payee {
  private readonly props: PayeeProps;

  private constructor(props: PayeeProps) {
    this.props = props;
  }

  public static create(props: PayeeProps): Payee {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('Payee name must have at least 2 characters.');
    }

    const cleanedTaxId = props.taxId.replace(/\D/g, '');

    if (props.taxIdType === 'CPF' && cleanedTaxId.length !== 11) {
      throw new Error('Invalid CPF length.');
    }

    if (props.taxIdType === 'CNPJ' && cleanedTaxId.length !== 14) {
      throw new Error('Invalid CNPJ length.');
    }

    return new Payee({
      ...props,
      name: props.name.trim(),
      taxId: cleanedTaxId,
    });
  }

  get name(): string {
    return this.props.name;
  }

  get taxId(): string {
    return this.props.taxId;
  }

  get taxIdType(): TaxIdType {
    return this.props.taxIdType;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  public equals(other: Payee): boolean {
    return (
      this.props.taxId === other.props.taxId &&
      this.props.taxIdType === other.props.taxIdType
    );
  }
}
