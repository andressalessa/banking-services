export class RequiredTradeNameError extends Error {
  constructor() {
    super('Trade name is required.');
    this.name = 'RequiredTradeNameError';
  }
}
