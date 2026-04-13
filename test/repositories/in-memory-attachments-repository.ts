import type { AttachmentsRepository } from '@/domain/logistics/application/repositories/attachments-repository'
import type { Attachment } from '@/domain/logistics/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []

  async create(attachment: Attachment) {
    this.items.push(attachment)
  }
}
