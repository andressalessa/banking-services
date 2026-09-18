export class InvalidPixKeyPhoneError extends Error {
  constructor(phone: string, reason?: string) {
    const message = reason
      ? `Invalid PIX key: Phone '${phone}' is not valid. ${reason}`
      : `Invalid PIX key: Phone '${phone}' is not valid. Must be in E.164 format (+5511987654321).`;
    super(message);
    this.name = 'InvalidPixKeyPhoneError';
  }
}
