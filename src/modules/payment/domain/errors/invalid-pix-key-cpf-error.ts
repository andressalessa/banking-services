export class InvalidPixKeyCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid PIX key: CPF '${cpf}' is not valid. Must be 11 digits with valid check digits.`);
    this.name = 'InvalidPixKeyCpfError';
  }
}
