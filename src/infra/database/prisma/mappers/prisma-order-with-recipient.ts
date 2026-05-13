import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'
import {
  Order as PrismaOrder,
  Recipient as PrismaRecipient,
} from '../client/client'

export class PrismaOrderWithRecipientMapper {
  static toDomainWithRecipient(
    raw: PrismaOrder & { recipient?: PrismaRecipient },
  ): OrderWithRecipient {
    if (!raw.recipient) {
      throw new Error('Recipient not loaded for order')
    }

    return OrderWithRecipient.create({
      id: new UniqueEntityId(raw.id),
      deliveryDriveId: raw.deliveryDriveId
        ? new UniqueEntityId(raw.deliveryDriveId)
        : undefined,
      status: OrderStatus.create(raw.status as OrderStatus['value']),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
      pickedAt: raw.pickedAt ?? undefined,
      deliveredAt: raw.deliveredAt ?? undefined,
      recipient: {
        id: new UniqueEntityId(raw.recipient.id),
        name: raw.recipient.name,
        zipCode: raw.recipient.zipCode,
        state: raw.recipient.state,
        city: raw.recipient.city,
        street: raw.recipient.street,
        neighborhood: raw.recipient.neighborhood,
        complement: raw.recipient.complement ?? undefined,
      },
    })
  }
}
