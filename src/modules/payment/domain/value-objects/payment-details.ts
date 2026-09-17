export type PaymentMethod = 'PIX' | 'BOLETO' | 'BANK_TRANSFER';

export interface PixPaymentDetails {
  method: 'PIX';
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
}

export interface BoletoPaymentDetails {
  method: 'BOLETO';
  barCode: string;
}

export interface BankTransferPaymentDetails {
  method: 'BANK_TRANSFER';
  bankCode: string;
  branch: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
}

export type PaymentDetailsProps =
  PixPaymentDetails | BoletoPaymentDetails | BankTransferPaymentDetails;

export class PaymentDetails {
  private readonly props: PaymentDetailsProps;

  private constructor(props: PaymentDetailsProps) {
    this.props = props;
  }

  public static create(props: PaymentDetailsProps): PaymentDetails {
    if (props.method === 'PIX') {
      if (!props.pixKey || props.pixKey.trim() === '') {
        throw new Error('PIX key is required for PIX payments.');
      }
    }

    if (props.method === 'BOLETO') {
      const cleanedBarCode = props.barCode.replace(/\D/g, '');
      if (cleanedBarCode.length < 44 || cleanedBarCode.length > 48) {
        throw new Error('Invalid boleto barcode length.');
      }
    }

    if (props.method === 'BANK_TRANSFER') {
      if (!props.bankCode || !props.branch || !props.accountNumber) {
        throw new Error(
          'Bank code, branch, and account number are required for bank transfer.',
        );
      }
    }

    return new PaymentDetails(props);
  }

  get method(): PaymentMethod {
    return this.props.method;
  }

  get details(): PaymentDetailsProps {
    return this.props;
  }

  public isPix(): boolean {
    return this.props.method === 'PIX';
  }

  public isBoleto(): boolean {
    return this.props.method === 'BOLETO';
  }

  public isBankTransfer(): boolean {
    return this.props.method === 'BANK_TRANSFER';
  }
}
