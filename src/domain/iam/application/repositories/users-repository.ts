import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { User } from '../../enterprise/entities/user'

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByLogin(document: string): Promise<User | null>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findManyDrivers(params: PaginationParams): Promise<User[]>
  abstract countDrivers(): Promise<number>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
