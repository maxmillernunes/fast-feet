import type { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'

export class OrderWithRecipientPresenter {
  static toHTTP(this: void, orderWithRecipient: OrderWithRecipient) {
    return {
      id: orderWithRecipient.id.toString(),
      status: orderWithRecipient.status.getContent(),
      deliveryDriveId: orderWithRecipient.deliveryDriveId?.toString(),
      createdAt: orderWithRecipient.createdAt,
      updatedAt: orderWithRecipient.updatedAt,
      pickedAt: orderWithRecipient.pickedAt,
      deliveredAt: orderWithRecipient.deliveredAt,
      recipient: {
        id: orderWithRecipient.recipient.id.toString(),
        name: orderWithRecipient.recipient.name,
        zipCode: orderWithRecipient.recipient.zipCode,
        state: orderWithRecipient.recipient.state,
        city: orderWithRecipient.recipient.city,
        street: orderWithRecipient.recipient.street,
        neighborhood: orderWithRecipient.recipient.neighborhood,
        complement: orderWithRecipient.recipient.complement,
      },
    }
  }
}
