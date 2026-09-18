import { AccountHolder, AccountHolderProps } from '../../value-objects/account-holder';

export function makeAccountHolder(
  override: Partial<AccountHolderProps> = {},
): AccountHolder {
  return AccountHolder.create({
    cnpj: '12345678000195',
    legalName: 'Test Company LLC',
    tradeName: 'Test Company',
    ...override,
  });
}
