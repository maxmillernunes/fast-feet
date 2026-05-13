import type { Recipient } from '@/domain/logistics/enterprise/entities/recipient'

export class RecipientPresenter {
  static toHTTP(this: void, recipient: Recipient) {
    return {
      id: recipient.id.toString(),
      name: recipient.name,
      document: recipient.document.getValue(),
      country: recipient.country,
      zipCode: recipient.zipCode,
      state: recipient.state,
      city: recipient.city,
      street: recipient.street,
      neighborhood: recipient.neighborhood,
      complement: recipient.complement,
      latitude: recipient.latitude,
      longitude: recipient.longitude,
      createdAt: recipient.createdAt,
      updatedAt: recipient.updatedAt,
    }
  }
}
