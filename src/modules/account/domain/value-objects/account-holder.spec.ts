import { AccountHolder } from './account-holder';
import { InvalidCnpjError } from '../errors/invalid-cnpj-error';
import { RequiredLegalNameError } from '../errors/required-legal-name-error';
import { RequiredTradeNameError } from '../errors/required-trade-name-error';

describe('AccountHolder Value Object', () => {
  it('should create an account holder with a valid CNPJ', () => {
    const holder = AccountHolder.create({
      cnpj: '12.345.678/0001-95',
      legalName: 'Company LLC',
      tradeName: 'Company',
    });

    expect(holder.cnpj).toBe('12345678000195');
  });

  it('should throw InvalidCnpjError for invalid CNPJ check digits', () => {
    expect(() =>
      AccountHolder.create({
        cnpj: '00.000.000/0000-00',
        legalName: 'Fake LLC',
        tradeName: 'Fake',
      }),
    ).toThrow(InvalidCnpjError);
  });

  it('should throw RequiredLegalNameError for missing legal name', () => {
    expect(() =>
      AccountHolder.create({
        cnpj: '12.345.678/0001-95',
        legalName: '',
        tradeName: 'Company',
      }),
    ).toThrow(RequiredLegalNameError);
  });

  it('should throw RequiredTradeNameError for missing trade name', () => {
    expect(() =>
      AccountHolder.create({
        cnpj: '12.345.678/0001-95',
        legalName: 'Company LLC',
        tradeName: '',
      }),
    ).toThrow(RequiredTradeNameError);
  });
});
