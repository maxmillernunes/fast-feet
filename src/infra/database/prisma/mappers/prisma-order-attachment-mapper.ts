import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'
import {
  Prisma,
  OrderAttachment as PrismaOrderAttachment,
} from '../client/client'

export class PrismaOrderAttachmentMapper {
  static toDomain(raw: PrismaOrderAttachment): OrderAttachment {
    return OrderAttachment.create(
      {
        orderId: new UniqueEntityId(raw.orderId),
        attachmentId: new UniqueEntityId(raw.attachmentId),
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(
    orderAttachment: OrderAttachment,
  ): Prisma.OrderAttachmentUncheckedCreateInput {
    return {
      id: orderAttachment.id.toString(),
      orderId: orderAttachment.orderId.toString(),
      attachmentId: orderAttachment.attachmentId.toString(),
    }
  }
}
