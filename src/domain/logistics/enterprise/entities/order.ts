import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from './values-objects/order-status'
import type { Optional } from '@/core/types/optional'
import { left, right, type Either } from '@/core/either'
import { DeliveryDriverDoesNotMatchError } from './errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToReturnedError } from './errors/order-can-not-transition-to-returned-error'
import { OrderCanNotTransitionToDeliveryError } from './errors/order-can-not-transition-to-delivery-error'
import { OrderCanNotTransitionToPickUpError } from './errors/order-can-not-transition-to-pickup-error'

export interface OrderProps {
  recipientId: UniqueEntityId
  deliveryDriveId?: UniqueEntityId
  status: OrderStatus
  createdAt: Date
  updatedAt?: Date
  pickedAt?: Date
  deliveredAt?: Date
}

type DeliveryOrder = Either<
  DeliveryDriverDoesNotMatchError | OrderCanNotTransitionToDeliveryError,
  null
>

type ReturnedOrder = Either<
  DeliveryDriverDoesNotMatchError | OrderCanNotTransitionToReturnedError,
  null
>

type PickUpOrder = Either<OrderCanNotTransitionToPickUpError, null>

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
  public pickUp(driveId: UniqueEntityId): PickUpOrder {
    if (!this.props.status.canTransitionTo('PICKED_UP')) {
      return left(new OrderCanNotTransitionToPickUpError())
    }

    this.props.deliveryDriveId = driveId
    this.props.status = OrderStatus.create('PICKED_UP')
    this.props.pickedAt = new Date()

    this.touch()

    return right(null)
  }

  public deliver(driverId: UniqueEntityId): DeliveryOrder {
    if (
      this.props.deliveryDriveId &&
      !this.props.deliveryDriveId.equals(driverId)
    ) {
      return left(new DeliveryDriverDoesNotMatchError())
    }

    if (!this.props.status.canTransitionTo('DELIVERED')) {
      return left(new OrderCanNotTransitionToDeliveryError())
    }

    this.props.status = OrderStatus.create('DELIVERED')
    this.props.deliveredAt = new Date()

    this.touch()

    return right(null)
  }

  public return(driverId: UniqueEntityId): ReturnedOrder {
    if (
      this.props.deliveryDriveId &&
      !this.props.deliveryDriveId.equals(driverId)
    ) {
      return left(new DeliveryDriverDoesNotMatchError())
    }

    if (!this.props.status.canTransitionTo('RETURNED')) {
      return left(new OrderCanNotTransitionToReturnedError())
    }

    this.props.status = OrderStatus.create('RETURNED')

    this.touch()

    return right(null)
  }

  static create(
    props: Optional<OrderProps, 'status' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    const order = new Order(
      {
        ...props,
        status: props.status ?? OrderStatus.create(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return order
  }
}
