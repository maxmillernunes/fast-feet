import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Recipient } from '@/domain/logistics/enterprise/entities/recipient'
import { Document } from '@/domain/logistics/enterprise/entities/values-objects/document'
import { Prisma, Recipient as PrismaRecipient } from '../client/client'

export class PrismaRecipientMapper {
  static toDomain(raw: PrismaRecipient): Recipient {
    const documentResult = Document.create(raw.document)

    if (documentResult.isLeft()) {
      throw new Error('Invalid document in database')
    }

    return Recipient.create(
      {
        name: raw.name,
        document: documentResult.value,
        country: raw.country,
        zipCode: raw.zipCode,
        state: raw.state,
        city: raw.city,
        street: raw.street,
        neighborhood: raw.neighborhood,
        complement: raw.complement ?? undefined,
        latitude: raw.latitude,
        longitude: raw.longitude,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt ?? undefined,
        deletedAt: raw.deletedAt ?? undefined,
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(recipient: Recipient): Prisma.RecipientUncheckedCreateInput {
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
      deletedAt: recipient.deletedAt ?? null,
    }
  }
}
