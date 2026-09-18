export class InvalidPhoneError extends Error {
  constructor(message: string = 'Invalid phone number.') {
    super(message);
  }
}
