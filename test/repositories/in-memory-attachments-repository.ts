import type { AttachmentsRepository } from '@/domain/logistics/application/repositories/attachments-repository'
import type { Attachment } from '@/domain/logistics/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []

  async create(attachment: Attachment) {
    this.items.push(attachment)
  }

  async findById(id: string): Promise<Attachment | null> {
    const attachment = this.items.find((item) => item.id.toString() === id)

    if (!attachment) {
      return null
    }

    return attachment
  }
}
