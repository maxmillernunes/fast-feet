import { Entity } from '@/core/entities/entity'
import type { Optional } from '@/core/types/optional'
import type { Document } from './values-objects/document'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface RecipientProps {
  name: string
  document: Document
  country: string
  zipCode: string
  state: string
  city: string
  street: string
  neighborhood: string
  complement?: string
  latitude: number
  longitude: number
  createdAt: Date
  updatedAt?: Date
}

export class Recipient extends Entity<RecipientProps> {
  get name() {
    return this.props.name
  }

  get document() {
    return this.props.document
  }

  get country() {
    return this.props.country
  }

  get zipCode() {
    return this.props.zipCode
  }

  get state() {
    return this.props.state
  }

  get city() {
    return this.props.city
  }

  get street() {
    return this.props.street
  }

  get neighborhood() {
    return this.props.neighborhood
  }

  get complement() {
    return this.props.complement
  }

  get latitude() {
    return this.props.latitude
  }

  get longitude() {
    return this.props.longitude
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<RecipientProps, 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    const recipient = new Recipient(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return recipient
  }
}
