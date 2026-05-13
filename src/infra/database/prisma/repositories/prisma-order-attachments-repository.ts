import { Injectable } from '@nestjs/common'
import { OrderAttachmentsRepository } from '@/domain/logistics/application/repositories/order-attachments-repository'
import { PrismaService } from '../prisma.service'
import type { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'
import { PrismaOrderAttachmentMapper } from '../mappers/prisma-order-attachment-mapper'

@Injectable()
export class PrismaOrderAttachmentsRepository implements OrderAttachmentsRepository {
  constructor(private prisma: PrismaService) {}

  async createMany(attachments: OrderAttachment[]): Promise<void> {
    const data = attachments.map((attachment) =>
      PrismaOrderAttachmentMapper.toPrisma(attachment),
    )

    await this.prisma.orderAttachment.createMany({ data })
  }

  async deleteMany(attachments: OrderAttachment[]): Promise<void> {
    const ids = attachments.map((attachment) => attachment.id.toString())

    await this.prisma.orderAttachment.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  }

  async findManyByOrderId(orderId: string): Promise<OrderAttachment[]> {
    const orderAttachments = await this.prisma.orderAttachment.findMany({
      where: {
        orderId,
      },
    })

    return orderAttachments.map((orderAttachment) =>
      PrismaOrderAttachmentMapper.toDomain(orderAttachment),
    )
  }

  async deleteManyByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderAttachment.deleteMany({
      where: {
        orderId,
      },
    })
  }
}
