export class InvalidPixKeyEmailError extends Error {
  constructor(email: string, reason?: string) {
    const message = reason 
      ? `Invalid PIX key: Email '${email}' is not valid. ${reason}`
      : `Invalid PIX key: Email '${email}' is not valid. Must be a valid email (max 77 chars).`;
    super(message);
    this.name = 'InvalidPixKeyEmailError';
  }
}
