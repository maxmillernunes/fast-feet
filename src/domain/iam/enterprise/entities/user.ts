import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserRole } from './values-objects/user-role'
import { Password } from './values-objects/password'
import type { Optional } from '@/core/types/optional'

export interface UserProps {
  name: string
  cpf: string
  role: UserRole
  password: Password
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

export class User extends Entity<UserProps> {
  get name(): string {
    return this.props.name
  }

  get cpf(): string {
    return this.props.cpf
  }

  get role(): UserRole {
    return this.props.role
  }

  get password(): Password {
    return this.props.password
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set password(password: Password) {
    this.props.password = password
    this.touch()
  }

  delete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Optional<UserProps, 'createdAt' | 'updatedAt' | 'deletedAt'>,
    id?: UniqueEntityId,
  ): User {
    return new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
