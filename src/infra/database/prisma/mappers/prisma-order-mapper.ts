import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import {
  Prisma,
  Order as PrismaOrder,
  OrderStatus as PrismaOrderStatus,
} from '../client/client'

export class PrismaOrderMapper {
  static toDomain(raw: PrismaOrder): Order {
    return Order.create(
      {
        recipientId: new UniqueEntityId(raw.recipientId),
        deliveryDriveId: raw.deliveryDriveId
          ? new UniqueEntityId(raw.deliveryDriveId)
          : undefined,
        status: OrderStatus.create(raw.status as OrderStatus['value']),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt ?? undefined,
        pickedAt: raw.pickedAt ?? undefined,
        deliveredAt: raw.deliveredAt ?? undefined,
        deletedAt: raw.deletedAt ?? undefined,
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(order: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: order.id.toString(),
      recipientId: order.recipientId.toString(),
      deliveryDriveId: order.deliveryDriveId?.toString(),
      status: order.status.getContent() as PrismaOrderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedAt: order.pickedAt,
      deliveredAt: order.deliveredAt,
      deletedAt: order.deletedAt ?? null,
    }
  }
}
