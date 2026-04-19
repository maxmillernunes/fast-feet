import { User } from '@/domain/iam/enterprise/entities/user'
import type { User as PrismaUser } from '../client/client'
import { UserRole } from '@/domain/iam/enterprise/entities/values-objects/user-role'
import { Password } from '@/domain/iam/enterprise/entities/values-objects/password'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: raw.name,
        cpf: raw.document,
        password: Password.createWithoutValidation(raw.password),
        role: UserRole.ADMIN,
        createdAt: raw.createdAt,
        deletedAt: raw.updatedAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    )
  }
}
