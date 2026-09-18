export class MemberNotFoundError extends Error {
  constructor() {
    super('Member was not found in this digital account.');
    this.name = 'MemberNotFoundError';
  }
}
