import { left, right, type Either } from '@/core/either'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { OrderCanNotTransitionToPickUpError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-pickup-error'

interface PickUpOrderUseCaseRequest {
  orderId: string
  deliveryDriveId: string
}

type PickUpOrderUseCaseResponse = Either<
  OrderCanNotTransitionToPickUpError | ResourceNotFoundError,
  { order: Order }
>

export class PickUpOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
    deliveryDriveId,
  }: PickUpOrderUseCaseRequest): Promise<PickUpOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    const result = order.pickUp(new UniqueEntityId(deliveryDriveId))

    if (result.isLeft()) {
      const error = result.value

      return left(error)
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
