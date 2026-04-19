import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { User, type UserProps } from '@/domain/iam/enterprise/entities/user'
import { Password } from '@/domain/iam/enterprise/entities/values-objects/password'
import { faker } from '@faker-js/faker'

const DEFAULT_PASSWORD = 'ValidPass123!'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityId,
) {
  const password = Password.create(`hashed_${DEFAULT_PASSWORD}`)

  const user = User.create(
    {
      login: override.login ?? faker.internet.username(),
      password: override.password ?? password,
      ...override,
    },
    id,
  )

  return user
}

export { DEFAULT_PASSWORD }
