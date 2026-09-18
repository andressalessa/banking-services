export const DecisionStatus = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type DecisionStatus =
  (typeof DecisionStatus)[keyof typeof DecisionStatus];

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ApprovalStatus =
  (typeof ApprovalStatus)[keyof typeof ApprovalStatus];
