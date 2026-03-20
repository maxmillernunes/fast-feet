import type { StatusOptions } from '../../enterprise/entities/values-objects/order-status'
import type { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { Either, right } from '@/core/either'

interface FetchDriverOrdersRequest {
  driverId: string
  status: StatusOptions[]
  page?: number
  perPage?: number
}

type FetchDriverOrdersResponse = Either<null, { orders: Order[] }>

export class FetchDriverOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    driverId,
    status,
    page = 1,
    perPage = 10,
  }: FetchDriverOrdersRequest): Promise<FetchDriverOrdersResponse> {
    const orders = await this.ordersRepository.findManyByDriver(
      driverId,
      status,
      { page, perPage },
    )

    return right({ orders })
  }
}
