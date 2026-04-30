import { Either, right } from '@/core/either'
import type { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'
import { Injectable } from '@nestjs/common'

interface FetchDeliveryDriversRequest {
  page: number
  perPage: number
}

type FetchDeliveryDriversResponse = Either<
  null,
  {
    drivers: User[]
    total: number
    page: number
    perPage: number
  }
>

@Injectable()
export class FetchDeliveryDriversUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    page,
    perPage,
  }: FetchDeliveryDriversRequest): Promise<FetchDeliveryDriversResponse> {
    const [drivers, total] = await Promise.all([
      this.usersRepository.findManyDrivers({ page, perPage }),
      this.usersRepository.countDrivers(),
    ])

    return right({
      drivers,
      total,
      page,
      perPage,
    })
  }
}
