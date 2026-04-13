import { OrdersRepository } from '../repositories/orders-repository'
import type { Order } from '../../enterprise/entities/order'
import { right, type Either } from '@/core/either'

interface FetchRecentOrdersUseCaseRequest {
  recipientId: string
  perPage?: number
  page?: number
}

type FetchRecentOrdersUseCaseResponse = Either<
  null,
  {
    orders: Order[]
  }
>

export class FetchRecentOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    recipientId,
    perPage = 10,
    page = 1,
  }: FetchRecentOrdersUseCaseRequest): Promise<FetchRecentOrdersUseCaseResponse> {
    const orders = await this.ordersRepository.findOrdersByRecipientId(
      recipientId,
      {
        page,
        perPage,
      },
    )

    return right({ orders })
  }
}
