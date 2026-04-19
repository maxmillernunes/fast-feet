import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Admin, type AdminProps } from '@/domain/iam/enterprise/entities/admin'
import { faker } from '@faker-js/faker'

export function makeAdmin(
  override: Partial<AdminProps> = {},
  id?: UniqueEntityId,
) {
  const admin = Admin.create(
    {
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      userId: new UniqueEntityId(),
      ...override,
    },
    id,
  )

  return admin
}
