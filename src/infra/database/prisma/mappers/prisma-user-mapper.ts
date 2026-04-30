import { User, UserRole } from '@/domain/iam/enterprise/entities/user'
import {
  Prisma,
  User as PrismaUser,
  UserRole as PrismaUserRole,
} from '../client/client'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Password } from '@/domain/iam/enterprise/entities/values-objects/password'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        document: raw.document,
        email: raw.email,
        name: raw.name,
        password: Password.create(raw.password),
        role: raw.role as UserRole,
        createdAt: raw.createdAt,
        deletedAt: raw.deletedAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toString(),
      document: user.document,
      email: user.email,
      name: user.name,
      password: user.password.value,
      role: user.role as PrismaUserRole,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt,
      updatedAt: user.updatedAt,
    }
  }
}
