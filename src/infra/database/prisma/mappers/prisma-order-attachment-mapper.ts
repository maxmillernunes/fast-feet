import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'
import { Prisma, Attachment as PrismaAttachment } from '../client/client'

export class PrismaOrderAttachmentMapper {
  static toDomain(raw: PrismaAttachment): OrderAttachment {
    if (!raw.orderId) {
      throw new Error('Invalid attachment type: orderId is required')
    }

    return OrderAttachment.create(
      {
        orderId: new UniqueEntityId(raw.orderId),
        attachmentId: new UniqueEntityId(raw.id),
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrismaUpdateMany(
    orderAttachments: OrderAttachment[],
  ): Prisma.AttachmentUpdateManyArgs {
    const attachmentIds = orderAttachments.map((attachment) =>
      attachment.attachmentId.toString(),
    )

    return {
      where: {
        id: {
          in: attachmentIds,
        },
      },
      data: {
        orderId: orderAttachments[0].orderId.toString(),
      },
    }
  }
}
