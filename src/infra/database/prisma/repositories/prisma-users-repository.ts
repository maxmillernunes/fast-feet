import { Injectable } from '@nestjs/common'
import { UsersRepository } from '@/domain/iam/application/repositories/users-repository'
import { PrismaService } from '../prisma.service'
import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { User } from '@/domain/iam/enterprise/entities/user'
import { PrismaUserMapper } from '../mappers/prisma-user-mapper'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByLogin(login: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        document: login,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findManyDrivers(params: PaginationParams): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: 'DRIVER',
      },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    })

    return users.map(PrismaUserMapper.toDomain)
  }

  async countDrivers(): Promise<number> {
    return this.prisma.user.count({
      where: {
        role: 'DRIVER',
      },
    })
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({ data })
  }

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.update({
      where: {
        id: data.id,
      },
      data,
    })
  }

  async delete(user: User): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: user.id.toString(),
      },
    })
  }
}
