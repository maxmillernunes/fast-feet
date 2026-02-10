import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  Recipient,
  type RecipientProps,
} from '@/domain/logistics/enterprise/entities/recipient'
import { Document } from '@/domain/logistics/enterprise/entities/values-objects/document'
import { faker } from '@faker-js/faker'

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
