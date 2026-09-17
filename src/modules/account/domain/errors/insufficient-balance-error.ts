export class InsufficientBalanceError extends Error {
  constructor() {
    super('Insufficient balance for this operation.');
    this.name = 'InsufficientBalanceError';
  }
}
