export class ExpenseIsNotApprovedError extends Error {
  constructor() {
    super('Expense is not approved.');
    this.name = 'ExpenseIsNotApproved';
  }
}
