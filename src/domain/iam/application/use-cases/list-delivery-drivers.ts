import { Either, right } from '@/core/either'
import type { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'

interface ListUsersRequest {
  page: number
  perPage: number
}

type ListUsersResponse = Either<
  null,
  {
    drivers: User[]
    total: number
    page: number
    perPage: number
  }
>

export class ListUsersUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    page,
    perPage,
  }: ListUsersRequest): Promise<ListUsersResponse> {
    const [drivers, total] = await Promise.all([
      this.usersRepository.findMany({ page, perPage }),
      this.usersRepository.count(),
    ])

    return right({
      drivers,
      total,
      page,
      perPage,
    })
  }
}
