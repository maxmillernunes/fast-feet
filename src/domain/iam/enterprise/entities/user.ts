import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Password } from './values-objects/password'
import type { Optional } from '@/core/types/optional'

export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
}

export interface UserProps {
  document: string
  password: Password
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
}

export class User extends Entity<UserProps> {
  get document(): string {
    return this.props.document
  }

  get password(): Password {
    return this.props.password
  }

  get email(): string {
    return this.props.email
  }

  get name(): string {
    return this.props.name
  }

  get role(): string {
    return this.props.role
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined | null {
    return this.props.updatedAt
  }

  get deletedAt(): Date | undefined | null {
    return this.props.deletedAt
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  delete(): void {
    this.props.deletedAt = new Date()

    this.touch()
  }

  set password(password: Password) {
    this.props.password = password

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
