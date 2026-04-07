import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'
import type { StatusOptions } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import type {
  FindManyNearbyOrdersParams,
  OrdersRepository,
} from '@/domain/logistics/application/repositories/orders-repository'
import { GetDistanceBetweenCoordinates } from '@test/utils/get-distance-between-coordinates'
import { InMemoryRecipientsRepository } from './in-memory-recipients-repository'
import { DomainEvents } from '@/core/events/domain-events'

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

  async findManyByDriver(
    driverId: string,
    status: StatusOptions[],
    { page, perPage }: PaginationParams,
  ): Promise<Order[]> {
    const orders = this.items.filter(
      (order) =>
        order.deliveryDriveId?.toString() === driverId &&
        status.includes(order.status.value),
    )

    const sorted = orders.sort(
      (a, b) => (b.pickedAt?.getTime() ?? 0) - (a.pickedAt?.getTime() ?? 0),
    )

    const start = (page - 1) * perPage
    const end = page * perPage

    return sorted.slice(start, end)
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.items.find((order) => order.id.toString() === id)

    if (!order) {
      return null
    }

    return order
  }

  async findByIdWithRecipient(id: string): Promise<OrderWithRecipient | null> {
    const order = this.items.find((order) => order.id.toString() === id)

    if (!order) {
      return null
    }

    const recipient = this.recipientsRepository.items.find((recipient) =>
      recipient.id.equals(order.recipientId),
    )

    if (!recipient) {
      throw new Error(
        `Recipient with ID "${order.recipientId.toString()}" does not exists`,
      )
    }

    return OrderWithRecipient.create({
      id: order.id,
      deliveryDriveId: order.deliveryDriveId,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedAt: order.pickedAt,
      deliveredAt: order.deliveredAt,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        zipCode: recipient.zipCode,
        state: recipient.state,
        city: recipient.city,
        street: recipient.street,
        neighborhood: recipient.neighborhood,
        complement: recipient.complement,
      },
    })
  }

  async save(order: Order): Promise<void> {
    const orderIndex = this.items.findIndex((item) => item.id.equals(order.id))

    this.items[orderIndex] = order

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async create(order: Order): Promise<void> {
    this.items.push(order)

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async delete(order: Order): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(order.id))
  }
}
