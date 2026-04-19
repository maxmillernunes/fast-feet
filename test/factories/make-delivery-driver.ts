import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  DeliveryDriver,
  DeliveryDriverProps,
} from '@/domain/iam/enterprise/entities/delivery-driver'
import { faker } from '@faker-js/faker'

export function makeDeliveryDriver(
  override: Partial<DeliveryDriverProps> = {},
  id?: UniqueEntityId,
) {
  const driver = DeliveryDriver.create(
    {
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      userId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return driver
}
