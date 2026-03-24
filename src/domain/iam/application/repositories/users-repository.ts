import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { User } from '../../enterprise/entities/user'

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByCpf(cpf: string): Promise<User | null>
  abstract findMany(params: PaginationParams): Promise<User[]>
  abstract count(): Promise<number>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
