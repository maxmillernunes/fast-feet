import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import type {
  FindManyNearbyOrdersParams,
  OrdersRepository,
} from '@/domain/logistics/application/repositories/orders-repository'
import { GetDistanceBetweenCoordinates } from '@test/utils/get-distance-between-coordinates'
import { InMemoryRecipientsRepository } from './in-memory-recipients-repository'

export class InMemoryOrdersRepository implements OrdersRepository {
  public items: Order[] = []

  constructor(private recipientsRepository: InMemoryRecipientsRepository) {}

  async findManyRecent({ page, perPage }: PaginationParams): Promise<Order[]> {
    const start = (page - 1) * perPage
    const end = page * perPage

    return this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, end)
  }

  async findManyNearby({
    latitude,
    longitude,
  }: FindManyNearbyOrdersParams): Promise<Order[]> {
    return this.items.filter((item) => {
      const recipient = this.recipientsRepository.items.find((recipient) =>
        recipient.id.equals(item.recipientId),
      )

      if (!recipient) {
        throw new Error('Orders must be associated with a recipient')
      }

      const distance = GetDistanceBetweenCoordinates.execute(
        { latitude: latitude, longitude: longitude },
        {
          latitude: recipient.latitude,
          longitude: recipient.longitude,
        },
      )

      //TO-DO: Should be return the order with the recipient

      return distance < 10 // 10km
    })
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.items.find((order) => order.id.toString() === id)

    if (!order) {
      return null
    }

    return order
  }

  async save(order: Order): Promise<void> {
    const orderIndex = this.items.findIndex((item) => item.id.equals(order.id))

    this.items[orderIndex] = order
  }

  async create(order: Order): Promise<void> {
    this.items.push(order)
  }

  async delete(order: Order): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(order.id))
  }
}
