import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  User,
  UserRole,
  type UserProps,
} from '@/domain/iam/enterprise/entities/user'
import { Password } from '@/domain/iam/enterprise/entities/values-objects/password'
import { faker } from '@faker-js/faker'

const DEFAULT_PASSWORD = 'ValidPass123!'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityId,
) {
  const password = Password.create(`hashed_${DEFAULT_PASSWORD}`)

  const admin = User.create(
    {
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: UserRole.DRIVER,
      password,
      ...override,
    },
    id,
  )

  return admin
}

export { DEFAULT_PASSWORD }
