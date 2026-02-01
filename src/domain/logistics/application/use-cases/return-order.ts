import { left, right, type Either } from '@/core/either'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { OrderCanNotTransitionToReturnedError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-returned-error'
import type { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'

interface ReturnOrderUseCaseRequest {
  orderId: string
  deliveryDriveId: string
}

type ReturnOrderUseCaseResponse = Either<
  | OrderCanNotTransitionToReturnedError
  | DeliveryDriverDoesNotMatchError
  | ResourceNotFoundError,
  { order: Order }
>

export class ReturnOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
    deliveryDriveId,
  }: ReturnOrderUseCaseRequest): Promise<ReturnOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    const result = order.return(new UniqueEntityId(deliveryDriveId))

    if (result.isLeft()) {
      const error = result.value

      return left(error)
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
