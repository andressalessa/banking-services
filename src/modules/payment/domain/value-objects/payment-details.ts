import { InvalidPixKeyCpfError } from '../errors/invalid-pix-key-cpf-error';
import { InvalidPixKeyCnpjError } from '../errors/invalid-pix-key-cnpj-error';
import { InvalidPixKeyEmailError } from '../errors/invalid-pix-key-email-error';
import { InvalidPixKeyPhoneError } from '../errors/invalid-pix-key-phone-error';
import { InvalidPixKeyRandomError } from '../errors/invalid-pix-key-random-error';
import { EmptyPixKeyError } from '../errors/empty-pix-key-error';

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

  /**
   * Validates CPF using official algorithm with check digits
   * Reference: Receita Federal do Brasil
   */
  private static validateCpf(cpf: string): void {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) {
      throw new InvalidPixKeyCpfError(cpf);
    }

    // Reject known invalid CPFs (all digits the same)
    if (/^(\d)\1{10}$/.test(digits)) {
      throw new InvalidPixKeyCpfError(cpf);
    }

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit >= 10) checkDigit = 0;
    if (checkDigit !== parseInt(digits.charAt(9))) {
      throw new InvalidPixKeyCpfError(cpf);
    }

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit >= 10) checkDigit = 0;
    if (checkDigit !== parseInt(digits.charAt(10))) {
      throw new InvalidPixKeyCpfError(cpf);
    }
  }

  /**
   * Validates CNPJ using official algorithm with check digits
   * Reference: Receita Federal do Brasil
   */
  private static validateCnpj(cnpj: string): void {
    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14) {
      throw new InvalidPixKeyCnpjError(cnpj);
    }

    // Reject known invalid CNPJs (all digits the same)
    if (/^(\d)\1{13}$/.test(digits)) {
      throw new InvalidPixKeyCnpjError(cnpj);
    }

    // Validate first check digit
    let length = digits.length - 2;
    let numbers = digits.substring(0, length);
    const checkDigits = digits.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(checkDigits.charAt(0))) {
      throw new InvalidPixKeyCnpjError(cnpj);
    }

    // Validate second check digit
    length = length + 1;
    numbers = digits.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(checkDigits.charAt(1))) {
      throw new InvalidPixKeyCnpjError(cnpj);
    }
  }

  /**
   * Validates email according to BACEN PIX specifications
   * Reference: BACEN - Manual de Chaves PIX
   * Max length: 77 characters
   */
  private static validateEmail(email: string): void {
    const trimmed = email.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new InvalidPixKeyEmailError(email, 'Email cannot be empty.');
    }

    if (trimmed.length > 77) {
      throw new InvalidPixKeyEmailError(email, 'Email must not exceed 77 characters.');
    }

    // RFC 5322 compliant regex (simplified but production-grade)
    const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    
    if (!emailRegex.test(trimmed)) {
      throw new InvalidPixKeyEmailError(email, 'Invalid email format.');
    }
  }

  /**
   * Validates phone according to E.164 format (BACEN requirement)
   * Reference: BACEN - Manual de Chaves PIX / ITU-T E.164
   * Format: +5511987654321 (country code + area code + number)
   * - Mobile: +55 + DD (2 digits) + 9XXXXXXXX (9 digits starting with 9)
   * - Landline: +55 + DD (2 digits) + XXXXXXXX (8 digits)
   */
  private static validatePhone(phone: string): void {
    const trimmed = phone.trim();

    // Must start with +55 (Brazil country code)
    if (!trimmed.startsWith('+55')) {
      throw new InvalidPixKeyPhoneError(phone, 'Phone must start with +55 (E.164 format).');
    }

    // Remove everything except digits and +
    const cleaned = trimmed.replace(/[^\d+]/g, '');

    // E.164 format: +55 followed by 10 or 11 digits
    const phoneRegex = /^\+55([1-9]{2})(9?\d{8})$/;
    const match = cleaned.match(phoneRegex);

    if (!match) {
      throw new InvalidPixKeyPhoneError(phone, 'Invalid format. Use +55DDNNNNNNNNN (DD = area code, N = number).');
    }

    const areaCode = match[1];
    const number = match[2];

    // Validate area code (11-99, reject invalid DDDs like 00-10)
    const areaCodeNum = parseInt(areaCode);
    if (areaCodeNum < 11 || areaCodeNum > 99) {
      throw new InvalidPixKeyPhoneError(phone, `Invalid area code '${areaCode}'. Must be between 11 and 99.`);
    }

    // Mobile numbers must have 9 digits starting with 9
    if (number.length === 9 && !number.startsWith('9')) {
      throw new InvalidPixKeyPhoneError(phone, 'Mobile numbers must start with 9.');
    }

    // Landline must have exactly 8 digits
    if (number.length === 8 && number.startsWith('9')) {
      throw new InvalidPixKeyPhoneError(phone, 'Landline numbers cannot start with 9.');
    }

    // Only 8 or 9 digits allowed
    if (number.length !== 8 && number.length !== 9) {
      throw new InvalidPixKeyPhoneError(phone, 'Phone number must have 8 (landline) or 9 (mobile) digits.');
    }
  }

  /**
   * Validates random key (EVP - Endereço Virtual de Pagamento)
   * Reference: BACEN - Must be UUID v4 format
   */
  private static validateRandomKey(key: string): void {
    const trimmed = key.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(trimmed)) {
      throw new InvalidPixKeyRandomError(key);
    }
  }

  private static validatePixKey(pixKey: string, pixKeyType: string): void {
    switch (pixKeyType) {
      case 'CPF':
        PaymentDetails.validateCpf(pixKey);
        break;
      case 'CNPJ':
        PaymentDetails.validateCnpj(pixKey);
        break;
      case 'EMAIL':
        PaymentDetails.validateEmail(pixKey);
        break;
      case 'PHONE':
        PaymentDetails.validatePhone(pixKey);
        break;
      case 'RANDOM':
        PaymentDetails.validateRandomKey(pixKey);
        break;
      default:
        throw new Error(`Unknown PIX key type: ${pixKeyType}`);
    }
  }

  public static create(props: PaymentDetailsProps): PaymentDetails {
    if (props.method === 'PIX') {
      if (!props.pixKey || props.pixKey.trim() === '') {
        throw new EmptyPixKeyError();
      }
      PaymentDetails.validatePixKey(props.pixKey, props.pixKeyType);
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
