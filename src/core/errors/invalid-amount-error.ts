export class InvalidAmountError extends Error {
  constructor() {
    super('Monetary amount cannot be negative.');
    this.name = 'InvalidAmountError';
  }
}
