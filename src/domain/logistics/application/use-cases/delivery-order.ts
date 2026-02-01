import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrdersRepository } from '../repositories/orders-repository'
import type { Order } from '../../enterprise/entities/order'
import { left, right, type Either } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { DeliveryDriverDoesNotMatchError } from '../../enterprise/entities/errors/delivery-driver-does-not-match-error'
import type { OrderCanNotTransitionToDeliveryError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-delivery-error'
import type { OrderCanNotTransitionToReturnedError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-returned-error'

interface DeliveryOrderUseCaseRequest {
  orderId: string
  deliveryDriveId: string
}

type DeliveryOrderUseCaseResponse = Either<
  | ResourceNotFoundError
  | DeliveryDriverDoesNotMatchError
  | OrderCanNotTransitionToDeliveryError
  | OrderCanNotTransitionToReturnedError,
  {
    order: Order
  }
>

export class DeliveryOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    deliveryDriveId,
    orderId,
  }: DeliveryOrderUseCaseRequest): Promise<DeliveryOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    const result = order.deliver(new UniqueEntityId(deliveryDriveId))

    if (result.isLeft()) {
      const error = result.value

      return left(error)
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
