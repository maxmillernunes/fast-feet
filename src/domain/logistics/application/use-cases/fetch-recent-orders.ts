import { OrdersRepository } from '../repositories/orders-repository'
import type { Order } from '../../enterprise/entities/order'
import { right, type Either } from '@/core/either'

interface FetchRecentOrdersUseCaseRequest {
  page?: number
  perPage?: number
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
    page = 1,
    perPage = 10,
  }: FetchRecentOrdersUseCaseRequest): Promise<FetchRecentOrdersUseCaseResponse> {
    const orders = await this.ordersRepository.findManyRecent({
      page,
      perPage,
    })

    return right({ orders })
  }
}
