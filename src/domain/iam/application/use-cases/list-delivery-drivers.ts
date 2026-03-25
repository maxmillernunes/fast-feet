import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface ListDeliveryDriversRequest {
  userId: string
  page: number
  perPage: number
}

type ListDeliveryDriversResponse = Either<
  NotAllowedError,
  {
    users: User[]
    total: number
    page: number
    perPage: number
  }
>

export class ListDeliveryDriversUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    page,
    perPage,
  }: ListDeliveryDriversRequest): Promise<ListDeliveryDriversResponse> {
    const currentUser = await this.usersRepository.findById(userId)
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return left(new NotAllowedError())
    }

    const [users, total] = await Promise.all([
      this.usersRepository.findMany({ page, perPage }),
      this.usersRepository.count(),
    ])

    return right({
      users,
      total,
      page,
      perPage,
    })
  }
}
