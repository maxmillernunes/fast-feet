import type { Attachment } from '@/domain/logistics/enterprise/entities/attachment'
import { Prisma } from '../client/client'

export class PrismaAttachmentMapper {
  static toPrisma(
    attachment: Attachment,
  ): Prisma.AttachmentUncheckedCreateInput {
    return {
      id: attachment.id.toString(),
      title: attachment.title,
      url: attachment.url,
    }
  }
}
