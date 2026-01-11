import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

/**
 * Order Status Enum, but will be a value object in the future, because has logic to validate transitions between statuses
 */
export enum OrderStatus {
  WAITING = 'WAITING', // Aguardando retirada
  PICKED_UP = 'PICKED_UP', // Retirada/Em trânsito
  DELIVERED = 'DELIVERED', // Entregue
  RETURNED = 'RETURNED', // Devolvida
}

interface OrderProps {
  recipientId: UniqueEntityId
  deliveryDriveId?: UniqueEntityId
  status: OrderStatus
  createdAt: Date
  updatedAt?: Date
  pickedAt?: Date
  deliveredAt?: Date
}

export class Order extends Entity<OrderProps> {
  get recipientId() {
    return this.props.recipientId
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

  private touch() {
    this.props.updatedAt = new Date()
  }

  /**
   * set the delivery driver assigned to pick up the order
   * @param driveId - UniqueEntityId of the delivery driver
   * @return void
   */
  pickUp(driveId: UniqueEntityId) {
    this.props.deliveryDriveId = driveId
    this.props.status = OrderStatus.PICKED_UP
    this.props.pickedAt = new Date()

    this.touch()
  }

  deliver(driverId: UniqueEntityId) {
    if (
      this.props.deliveryDriveId &&
      !this.props.deliveryDriveId.equals(driverId)
    ) {
      throw new Error('Driver does not match')
    }

    if (this.props.status !== OrderStatus.PICKED_UP) {
      throw new Error('Order must be in PICKED_UP status to be delivered.')
    }

    this.props.status = OrderStatus.DELIVERED
    this.props.deliveredAt = new Date()

    this.touch()
  }

  public return() {
    this.props.status = OrderStatus.RETURNED

    this.touch()
  }

  static create(props: Optional<OrderProps, 'status' | 'createdAt'>) {
    const order = new Order({
      ...props,
      status: props.status ?? OrderStatus.WAITING,
      createdAt: props.createdAt ?? new Date(),
    })

    return order
  }
}
