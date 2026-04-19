import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface DeliveryDriverProps {
  name: string
  email: string
  document: string
  userId: UniqueEntityId
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
}

export class DeliveryDriver extends Entity<DeliveryDriverProps> {
  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  get document() {
    return this.props.document
  }

  get userId() {
    return this.props.userId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get deletedAt() {
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

  static create(
    props: Optional<
      DeliveryDriverProps,
      'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    id?: UniqueEntityId,
  ): DeliveryDriver {
    return new DeliveryDriver(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
