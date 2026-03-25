import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { User, type UserProps } from '@/domain/iam/enterprise/entities/user'
import { UserRole } from '@/domain/iam/enterprise/entities/values-objects/user-role'
import { Password } from '@/domain/iam/enterprise/entities/values-objects/password'
import { faker } from '@faker-js/faker'

const DEFAULT_PASSWORD = 'ValidPass123!'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityId,
) {
  const password = Password.createWithoutValidation(
    `hashed_${DEFAULT_PASSWORD}`,
  )

  const user = User.create(
    {
      name: override.name ?? faker.person.fullName(),
      cpf: override.cpf ?? faker.string.numeric(11),
      role: override.role ?? UserRole.DELIVERY_DRIVER,
      password: override.password ?? password,
      ...override,
    },
    id,
  )

  return user
}

export { DEFAULT_PASSWORD }
