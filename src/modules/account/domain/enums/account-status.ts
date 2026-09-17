export const AccountStatus = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  CLOSED: 'CLOSED',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
