import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  Recipient,
  type RecipientProps,
} from '@/domain/logistics/enterprise/entities/recipient'
import { Document } from '@/domain/logistics/enterprise/entities/values-objects/document'
import { PrismaRecipientMapper } from '@/infra/database/prisma/mappers/prisma-recipient-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function makeRecipient(
  override: Partial<RecipientProps> = {},
  id?: UniqueEntityId,
) {
  const document = Document.create(faker.string.numeric(11))

  if (document.isLeft()) {
    throw new Error('Failed to create document for recipient factory')
  }

  const recipient = Recipient.create(
    {
      name: faker.person.fullName(),
      document: document.value,
      latitude: -23.55052,
      longitude: -46.633308,
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
      state: faker.location.state(),
      city: faker.location.city(),
      street: faker.location.street(),
      neighborhood: faker.location.streetAddress(),
      complement: faker.location.secondaryAddress(),
      ...override,
    },
    id,
  )

  return recipient
}

@Injectable()
export class RecipientFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaRecipient(
    data: Partial<RecipientProps> = {},
  ): Promise<Recipient> {
    const recipient = makeRecipient(data)

    await this.prisma.recipient.create({
      data: PrismaRecipientMapper.toPrisma(recipient),
    })

    return recipient
  }
}
