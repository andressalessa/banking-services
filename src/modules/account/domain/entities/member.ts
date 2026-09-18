import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CPF } from '@/core/value-objects/cpf';
import { Email } from '@/core/value-objects/email';
import { Phone } from '@/core/value-objects/phone';
import { Optional } from '@/core/types/optional';

export enum MemberRole {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface MemberProps {
  personId: UniqueEntityID;
  fullName?: string;
  cpf?: CPF;
  email?: Email;
  phone?: Phone;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
}

export class Member extends Entity<MemberProps> {
  static create(
    props: Optional<MemberProps, 'createdAt' | 'status'>,
    id?: UniqueEntityID,
  ): Member {
    return new Member(
      {
        ...props,
        status: props.status ?? MemberStatus.ACTIVE,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  get personId(): UniqueEntityID {
    return this.props.personId;
  }

  get fullName(): string | undefined {
    return this.props.fullName;
  }

  get cpf(): CPF | undefined {
    return this.props.cpf;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get phone(): Phone | undefined {
    return this.props.phone;
  }

  get role(): MemberRole {
    return this.props.role;
  }

  get status(): MemberStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public isActive(): boolean {
    return this.props.status === MemberStatus.ACTIVE;
  }

  public isApprover(): boolean {
    return (
      this.props.role === MemberRole.ADMIN &&
      this.props.status === MemberStatus.ACTIVE
    );
  }

  public promoteToAdmin(): void {
    this.props.role = MemberRole.ADMIN;
  }

  public demoteToCollaborator(): void {
    this.props.role = MemberRole.COLLABORATOR;
  }

  public deactivate(): void {
    this.props.status = MemberStatus.INACTIVE;
  }

  public activate(): void {
    this.props.status = MemberStatus.ACTIVE;
  }

  public changeStatus(status: MemberStatus): void {
    this.props.status = status;
  }
}
