import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import type { Recipient } from '@/domain/logistics/enterprise/entities/recipient'

export class InMemoryRecipientsRepository implements RecipientsRepository {
  public items: Recipient[] = []

  async findById(id: string): Promise<Recipient | null> {
    const recipient = this.items.find(
      (recipient) => recipient.id.toString() === id,
    )

    if (!recipient) {
      return null
    }

    return recipient
  }

  async findByDocument(document: string): Promise<Recipient | null> {
    const recipient = this.items.find(
      (recipient) => recipient.document.getValue() === document,
    )

    if (!recipient) {
      return null
    }

    return recipient
  }

  async findMany({ page, perPage }: PaginationParams): Promise<Recipient[]> {
    const start = (page - 1) * perPage
    const end = page * perPage

    return this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, end)
  }

  async save(recipient: Recipient): Promise<void> {
    const recipientIndex = this.items.findIndex((item) =>
      item.id.equals(recipient.id),
    )

    this.items[recipientIndex] = recipient
  }

  async create(recipient: Recipient): Promise<void> {
    this.items.push(recipient)
  }

  async delete(recipient: Recipient): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(recipient.id))
  }
}
