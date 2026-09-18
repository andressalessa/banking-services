export class AccountNotFoundError extends Error {
  constructor() {
    super('Digital account was not found.');
    this.name = 'AccountNotFoundError';
  }
}
