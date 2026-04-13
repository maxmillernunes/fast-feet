import { left, right, type Either } from '@/core/either'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'

interface MarkOrderAsAwaitingUseCaseRequest {
  orderId: string
}

type MarkOrderAsAwaitingUseCaseResponse = Either<
  OrderCanNotTransitionToWaitingError | ResourceNotFoundError,
  { order: Order }
>

export class MarkOrderAsAwaitingUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
  }: MarkOrderAsAwaitingUseCaseRequest): Promise<MarkOrderAsAwaitingUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    const result = order.markAsAwaiting()

    if (result.isLeft()) {
      return left(result.value)
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
