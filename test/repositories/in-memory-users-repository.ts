import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { UsersRepository } from '@/domain/iam/application/repositories/users-repository'
import { User } from '@/domain/iam/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public users: User[] = []

  async findById(id: string): Promise<User | null> {
    return (
      this.users.find((u) => u.id.toString() === id && !u.isDeleted) ?? null
    )
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.users.find((u) => u.cpf === cpf && !u.isDeleted) ?? null
  }

  async findMany({ page, perPage }: PaginationParams): Promise<User[]> {
    const active = this.users.filter((u) => !u.isDeleted)
    const start = (page - 1) * perPage
    const end = start + perPage
    return active.slice(start, end)
  }

  async count(): Promise<number> {
    return this.users.filter((u) => !u.isDeleted).length
  }

  async create(user: User): Promise<void> {
    this.users.push(user)
  }

  async save(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id.equals(user.id))
    if (index !== -1) {
      this.users[index] = user
    }
  }

  async delete(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id.equals(user.id))
    if (index !== -1) {
      this.users.splice(index, 1)
    }
  }
}
