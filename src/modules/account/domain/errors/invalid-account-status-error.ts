import type { AccountStatus } from '../enums/account-status';

export class InvalidAccountStatusError extends Error {
  constructor(current: AccountStatus, next?: AccountStatus) {
    super(
      next
        ? `Cannot change account status from ${current} to ${next}.`
        : `Operation is not allowed when account status is ${current}.`,
    );
    this.name = 'InvalidAccountStatusError';
  }
}
