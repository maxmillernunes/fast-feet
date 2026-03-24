import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface ListDeliveryDriversRequest {
  page: number
  perPage: number
}

interface ListDeliveryDriversResponse {
  users: User[]
  total: number
  page: number
  perPage: number
}

export class ListDeliveryDriversUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    page,
    perPage,
  }: ListDeliveryDriversRequest): Promise<ListDeliveryDriversResponse> {
    const [users, total] = await Promise.all([
      this.usersRepository.findMany({ page, perPage }),
      this.usersRepository.count(),
    ])

    return {
      users,
      total,
      page,
      perPage,
    }
  }
}
