import { Injectable } from '@nestjs/common';
import { AccountBalancePort } from '../../../payment/application/ports/account-balance.port';
import { ManageAccountBalanceUseCase } from '../../application/use-cases/manage-account-balance.use-case';

@Injectable()
export class AccountBalanceAdapter implements AccountBalancePort {
  constructor(
    private readonly manageBalance: ManageAccountBalanceUseCase,
  ) {}

  async reserveBalance(
    accountId: string,
    amountInCents: number,
    reason: string,
  ) {
    return this.manageBalance.reserveBalance({
      accountId,
      amountInCents,
      reason,
    });
  }

  async releaseBalance(
    accountId: string,
    amountInCents: number,
    reason: string,
  ) {
    return this.manageBalance.releaseBalance({
      accountId,
      amountInCents,
      reason,
    });
  }

  async confirmDebit(accountId: string, amountInCents: number, reason: string) {
    return this.manageBalance.confirmDebit({
      accountId,
      amountInCents,
      reason,
    });
  }
}
