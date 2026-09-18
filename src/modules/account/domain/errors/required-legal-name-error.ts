export class RequiredLegalNameError extends Error {
  constructor() {
    super('Legal name is required.');
    this.name = 'RequiredLegalNameError';
  }
}
