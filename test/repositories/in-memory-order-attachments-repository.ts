import type { OrderAttachmentsRepository } from '@/domain/logistics/application/repositories/order-attachments-repository'
import type { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'

export class InMemoryOrderAttachmentsRepository implements OrderAttachmentsRepository {
  public items: OrderAttachment[] = []

  async createMany(attachments: OrderAttachment[]) {
    this.items.push(...attachments)
  }

  async deleteMany(attachments: OrderAttachment[]): Promise<void> {
    const orderAttachments = this.items.filter((item) => {
      return !attachments.some((attachment) => attachment.equals(item))
    })

    this.items = orderAttachments
  }

  async findManyByOrderId(orderId: string) {
    const orderAttachments = this.items.filter(
      (item) => item.orderId.toString() === orderId,
    )

    return orderAttachments
  }

  async deleteManyByOrderId(orderId: string) {
    const orderAttachments = this.items.filter(
      (item) => item.orderId.toString() !== orderId,
    )

    this.items = orderAttachments
  }
}
