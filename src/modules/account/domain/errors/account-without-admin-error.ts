export class AccountWithoutAdminError extends Error {
  constructor() {
    super('Cannot activate a digital account without at least one active admin.');
    this.name = 'AccountWithoutAdminError';
  }
}
