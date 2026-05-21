import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  Order,
  type OrderProps,
} from '@/domain/logistics/enterprise/entities/order'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'

import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaOrderMapper } from '@/infra/database/prisma/mappers/prisma-order-mapper'

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

@Injectable()
export class OrderFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaOrder(data: Partial<OrderProps> = {}): Promise<Order> {
    const order = makeOrder(data, new UniqueEntityId())

    await this.prisma.order.create({
      data: PrismaOrderMapper.toPrisma(order),
    })

    return order
  }
}
