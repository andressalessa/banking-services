export class DuplicateMemberError extends Error {
  constructor() {
    super('A member with this person id already belongs to the account.');
    this.name = 'DuplicateMemberError';
  }
}
