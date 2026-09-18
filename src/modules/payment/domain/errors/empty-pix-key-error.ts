export class EmptyPixKeyError extends Error {
  constructor() {
    super('PIX key is required for PIX payments.');
    this.name = 'EmptyPixKeyError';
  }
}
