import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  Order,
  type OrderProps,
} from '@/domain/logistics/enterprise/entities/order'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'

export function makeOrder(
  override: Partial<OrderProps> = {},
  id?: UniqueEntityId,
) {
  const order = Order.create(
    {
      recipientId: new UniqueEntityId(),
      status: override.status ?? OrderStatus.create(),
      ...override,
    },
    id,
  )

  return order
}
