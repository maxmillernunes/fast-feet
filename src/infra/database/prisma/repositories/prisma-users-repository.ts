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
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByCpf(cpf: string): Promise<User | null> {
    throw new Error('Method not implemented.')
  }

  async findMany(params: PaginationParams): Promise<User[]> {
    throw new Error('Method not implemented.')
  }

  async count(): Promise<number> {
    throw new Error('Method not implemented.')
  }

  async create(user: User): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async save(user: User): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async delete(user: User): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
