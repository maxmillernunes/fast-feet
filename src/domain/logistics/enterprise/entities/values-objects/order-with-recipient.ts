import { ValueObject } from '@/core/entities/value-object'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { OrderStatus } from './order-status'

export interface OrderWithRecipientProps {
  id: UniqueEntityId
  deliveryDriveId?: UniqueEntityId
  status: OrderStatus
  createdAt: Date
  updatedAt?: Date
  pickedAt?: Date
  deliveredAt?: Date
  recipient: {
    id: UniqueEntityId
    name: string
    zipCode: string
    state: string
    city: string
    street: string
    neighborhood: string
    complement?: string
  }
}

export class OrderWithRecipient extends ValueObject<OrderWithRecipientProps> {
  get id() {
    return this.props.id
  }

  get deliveryDriveId() {
    return this.props.deliveryDriveId
  }

  get status() {
    return this.props.status
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get pickedAt() {
    return this.props.pickedAt
  }

  get deliveredAt() {
    return this.props.deliveredAt
  }

  get recipient() {
    return this.props.recipient
  }

  static create(props: OrderWithRecipientProps) {
    return new OrderWithRecipient(props)
  }
}
