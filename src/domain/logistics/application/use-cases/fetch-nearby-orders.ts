import { right, type Either } from '@/core/either'
import type { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'

interface FetchNearbyOrdersRequest {
  userLatitude: number
  userLongitude: number
}

type FetchNearbyOrdersResponse = Either<
  null,
  {
    orders: Order[]
  }
>

export class FetchNearbyOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    userLatitude,
    userLongitude,
  }: FetchNearbyOrdersRequest): Promise<FetchNearbyOrdersResponse> {
    const orders = await this.ordersRepository.findManyNearby({
      latitude: userLatitude,
      longitude: userLongitude,
    })

    return right({ orders })
  }
}
