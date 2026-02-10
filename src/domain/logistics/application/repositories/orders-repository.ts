import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Order } from '../../enterprise/entities/order'

export type FindManyNearbyOrdersParams = {
  latitude: number
  longitude: number
}

export abstract class OrdersRepository {
  abstract findById(id: string): Promise<Order | null>
  abstract findManyRecent(params: PaginationParams): Promise<Order[]>
  abstract findManyNearby(params: FindManyNearbyOrdersParams): Promise<Order[]>
  abstract create(order: Order): Promise<void>
  abstract save(order: Order): Promise<void>
  abstract delete(order: Order): Promise<void>
}
