import { left, right, type Either } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { OrderWithRecipient } from '../../enterprise/entities/values-objects/order-with-recipient'
import type { OrdersRepository } from '../repositories/orders-repository'

interface GetOrderDetailsByIdUseCaseRequest {
  orderId: string
}

type GetOrderDetailsByIdUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    order: OrderWithRecipient
  }
>

export class GetOrderDetailsByIdUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
  }: GetOrderDetailsByIdUseCaseRequest): Promise<GetOrderDetailsByIdUseCaseResponse> {
    const order = await this.ordersRepository.findByIdWithRecipient(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    return right({ order })
  }
}
