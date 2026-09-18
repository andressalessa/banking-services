export class InvalidCnpjError extends Error {
  constructor() {
    super('Invalid CNPJ format or check digits.');
    this.name = 'InvalidCnpjError';
  }
}
