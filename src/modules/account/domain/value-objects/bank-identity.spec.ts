import { BankIdentity } from './bank-identity';

describe('BankIdentity', () => {
  describe('create', () => {
    it('should create bank identity with valid data', () => {
      const bankIdentity = BankIdentity.create({
        externalAccountId: 'ext-acc-123',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
      });

      expect(bankIdentity.externalAccountId).toBe('ext-acc-123');
      expect(bankIdentity.bankCode).toBe('001');
      expect(bankIdentity.branch).toBe('0001');
      expect(bankIdentity.accountNumber).toBe('123456-7');
    });

    it('should throw error for empty external account id', () => {
      expect(() =>
        BankIdentity.create({
          externalAccountId: '',
          bankCode: '001',
          branch: '0001',
          accountNumber: '123456-7',
        }),
      ).toThrow('External account id is required.');
    });

    it('should throw error for invalid bank code length', () => {
      expect(() =>
        BankIdentity.create({
          externalAccountId: 'ext-acc-123',
          bankCode: '12', // 2 digits instead of 3
          branch: '0001',
          accountNumber: '123456-7',
        }),
      ).toThrow('Invalid bank code.');
    });

    it('should strip non-digits from bank code', () => {
      const bankIdentity = BankIdentity.create({
        externalAccountId: 'ext-acc-123',
        bankCode: '0-0-1',
        branch: '0001',
        accountNumber: '123456-7',
      });

      expect(bankIdentity.bankCode).toBe('001');
    });

    it('should throw error for empty branch', () => {
      expect(() =>
        BankIdentity.create({
          externalAccountId: 'ext-acc-123',
          bankCode: '001',
          branch: '',
          accountNumber: '123456-7',
        }),
      ).toThrow('Branch is required.');
    });

    it('should throw error for empty account number', () => {
      expect(() =>
        BankIdentity.create({
          externalAccountId: 'ext-acc-123',
          bankCode: '001',
          branch: '0001',
          accountNumber: '',
        }),
      ).toThrow('Account number is required.');
    });

    it('should trim whitespace from external account id, branch, and account number', () => {
      const bankIdentity = BankIdentity.create({
        externalAccountId: '  ext-acc-123  ',
        bankCode: '001',
        branch: '  0001  ',
        accountNumber: '  123456-7  ',
      });

      expect(bankIdentity.externalAccountId).toBe('ext-acc-123');
      expect(bankIdentity.branch).toBe('0001');
      expect(bankIdentity.accountNumber).toBe('123456-7');
    });
  });

  describe('equals', () => {
    it('should return true for identical bank identities', () => {
      const bank1 = BankIdentity.create({
        externalAccountId: 'ext-acc-123',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
      });

      const bank2 = BankIdentity.create({
        externalAccountId: 'ext-acc-123',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
      });

      expect(bank1.equals(bank2)).toBe(true);
    });

    it('should return false for different bank identities', () => {
      const bank1 = BankIdentity.create({
        externalAccountId: 'ext-acc-123',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
      });

      const bank2 = BankIdentity.create({
        externalAccountId: 'ext-acc-456',
        bankCode: '001',
        branch: '0001',
        accountNumber: '123456-7',
      });

      expect(bank1.equals(bank2)).toBe(false);
    });
  });
});
