export class InvalidPixKeyCnpjError extends Error {
  constructor(cnpj: string) {
    super(`Invalid PIX key: CNPJ '${cnpj}' is not valid. Must be 14 digits with valid check digits.`);
    this.name = 'InvalidPixKeyCnpjError';
  }
}
