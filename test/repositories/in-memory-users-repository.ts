import type { PaginationParams } from '@/core/repositories /pagination-params'
import { UsersRepository } from '@/domain/iam/application/repositories/users-repository'
import { User } from '@/domain/iam/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async findById(id: string): Promise<User | null> {
    return (
      this.items.find((u) => u.id.toString() === id && !u.isDeleted) ?? null
    )
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.items.find((u) => u.document === login && !u.isDeleted) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email === email && !u.isDeleted) ?? null
  }

  async findMany({ page, perPage }: PaginationParams): Promise<User[]> {
    const active = this.items.filter((u) => !u.isDeleted)
    const start = (page - 1) * perPage
    const end = start + perPage
    return active.slice(start, end)
  }

  async count(): Promise<number> {
    return this.items.filter((u) => !u.isDeleted).length
  }

  async create(user: User): Promise<void> {
    this.items.push(user)
  }

  async save(user: User): Promise<void> {
    const index = this.items.findIndex((u) => u.id.equals(user.id))
    if (index !== -1) {
      this.items[index] = user
    }
  }

  async delete(user: User): Promise<void> {
    const index = this.items.findIndex((u) => u.id.equals(user.id))

    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }
}
