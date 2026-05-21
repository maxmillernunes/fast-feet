import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  User,
  UserRole,
  type UserProps,
} from '@/domain/iam/enterprise/entities/user'
import { Password } from '@/domain/iam/enterprise/entities/values-objects/password'
import { PrismaUserMapper } from '@/infra/database/prisma/mappers/prisma-user-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { hash } from 'bcrypt'

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

@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaUser(data: Partial<UserProps> = {}): Promise<User> {
    const user = makeUser(data)

    const password = data.password?.value || DEFAULT_PASSWORD
    const hashedPassword = await hash(password, 10)

    await this.prisma.user.create({
      data: {
        ...PrismaUserMapper.toPrisma(user),
        password: hashedPassword,
      },
    })

    return user
  }
}

export { DEFAULT_PASSWORD }
