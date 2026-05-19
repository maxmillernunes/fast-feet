import { Injectable } from '@nestjs/common'
import { OrderAttachmentsRepository } from '@/domain/logistics/application/repositories/order-attachments-repository'
import { PrismaService } from '../prisma.service'
import type { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'
import { PrismaOrderAttachmentMapper } from '../mappers/prisma-order-attachment-mapper'

@Injectable()
export class PrismaOrderAttachmentsRepository implements OrderAttachmentsRepository {
  constructor(private prisma: PrismaService) {}

  async createMany(attachments: OrderAttachment[]): Promise<void> {
    const data = PrismaOrderAttachmentMapper.toPrismaUpdateMany(attachments)

    await this.prisma.attachment.updateMany(data)
  }

  async deleteMany(attachments: OrderAttachment[]): Promise<void> {
    const ids = attachments.map((attachment) => attachment.id.toString())

    await this.prisma.attachment.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  }
}
