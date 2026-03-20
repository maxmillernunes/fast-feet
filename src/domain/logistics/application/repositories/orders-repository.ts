import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Order } from '../../enterprise/entities/order'
import type { OrderWithRecipient } from '../../enterprise/entities/values-objects/order-with-recipient'
import type { StatusOptions } from '../../enterprise/entities/values-objects/order-status'

export type FindManyNearbyOrdersParams = {
  latitude: number
  longitude: number
}

export abstract class OrdersRepository {
  abstract findById(id: string): Promise<Order | null>
  abstract findByIdWithRecipient(id: string): Promise<OrderWithRecipient | null>
  abstract findManyRecent(params: PaginationParams): Promise<Order[]>
  abstract findManyNearby(params: FindManyNearbyOrdersParams): Promise<Order[]>
  abstract findManyByDriver(
    driverId: string,
    status: StatusOptions[],
    params: PaginationParams,
  ): Promise<Order[]>
  abstract create(order: Order): Promise<void>
  abstract save(order: Order): Promise<void>
  abstract delete(order: Order): Promise<void>
}
