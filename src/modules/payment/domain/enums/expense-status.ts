export const ExpenseStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;

export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
