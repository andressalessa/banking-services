export class CannotRemoveLastApproverError extends Error {
  constructor() {
    super('A digital account must keep at least one active approver.');
    this.name = 'CannotRemoveLastApproverError';
  }
}
