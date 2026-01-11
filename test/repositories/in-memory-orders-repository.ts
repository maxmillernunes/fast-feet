import type { OrdersRepository } from '@/domain/logistics/application/repositories/orders-repository'
import type { Order } from '@/domain/logistics/enterprise/entities/order'

export class InMemoryOrdersRepository implements OrdersRepository {
  public items: Order[] = []

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
}
