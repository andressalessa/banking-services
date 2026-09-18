export class InvalidPixKeyRandomError extends Error {
  constructor(key: string) {
    super(`Invalid PIX key: Random key '${key}' is not valid. Must be a valid UUID v4.`);
    this.name = 'InvalidPixKeyRandomError';
  }
}
