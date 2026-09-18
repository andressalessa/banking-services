import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { DomainEvents } from '@/core/events/domain-events';
import { Member, MemberStatus } from '../../domain/entities/member';
import { AccountNotFoundError } from '../../domain/errors/account-not-found-error';
import { CannotRemoveLastApproverError } from '../../domain/errors/cannot-remove-last-approver-error';
import { DuplicateMemberError } from '../../domain/errors/duplicate-member-error';
import { MemberNotFoundError } from '../../domain/errors/member-not-found-error';
import { DigitalAccountRepository } from '../repositories/digital-account-repository';

interface AddMemberRequest {
  accountId: string;
  member: Member;
}

interface ChangeMemberStatusRequest {
  accountId: string;
  memberId: string;
  newStatus: MemberStatus;
}

type AddMemberResponse = Either<
  AccountNotFoundError | DuplicateMemberError,
  void
>;

type ChangeMemberStatusResponse = Either<
  | AccountNotFoundError
  | MemberNotFoundError
  | CannotRemoveLastApproverError,
  void
>;

/**
 * Unified Use Case for all Account Member operations
 *
 * Consolidates member management operations to avoid file proliferation:
 * - addMember: Add a new member to the account
 * - changeMemberStatus: Change status of existing member (activate/deactivate)
 *
 * All operations follow the same pattern:
 * 1. Find account by ID
 * 2. Execute domain operation
 * 3. Save account
 * 4. Dispatch domain events
 */
@Injectable()
export class ManageAccountMembersUseCase {
  constructor(
    private readonly digitalAccountRepository: DigitalAccountRepository,
  ) {}

  /**
   * Add a new member to the account
   */
  async addMember({
    accountId,
    member,
  }: AddMemberRequest): Promise<AddMemberResponse> {
    const account = await this.digitalAccountRepository.findById(
      new UniqueEntityID(accountId),
    );

    if (!account) {
      return left(new AccountNotFoundError());
    }

    try {
      account.addMember(member);
    } catch (error) {
      if (error instanceof DuplicateMemberError) {
        return left(error);
      }
      throw error;
    }

    await this.digitalAccountRepository.save(account);
    await DomainEvents.dispatchEventsForAggregate(account.id);

    return right(undefined);
  }

  /**
   * Change status of existing member
   * Used to activate or deactivate member access
   */
  async changeMemberStatus({
    accountId,
    memberId,
    newStatus,
  }: ChangeMemberStatusRequest): Promise<ChangeMemberStatusResponse> {
    const account = await this.digitalAccountRepository.findById(
      new UniqueEntityID(accountId),
    );

    if (!account) {
      return left(new AccountNotFoundError());
    }

    try {
      account.changeMemberStatus(new UniqueEntityID(memberId), newStatus);
    } catch (error) {
      if (error instanceof MemberNotFoundError) {
        return left(error);
      }
      if (error instanceof CannotRemoveLastApproverError) {
        return left(error);
      }
      throw error;
    }

    await this.digitalAccountRepository.save(account);
    await DomainEvents.dispatchEventsForAggregate(account.id);

    return right(undefined);
  }
}
