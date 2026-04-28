import { Either, left, right } from '@/core/either'
import { DriverNotFoundError } from './errors/user-not-found-error'
import { UsersRepository } from '../repositories/users-repository'
import type { User } from '../../enterprise/entities/user'

interface GetUserRequest {
  driverId: string
}

type GetUserResponse = Either<DriverNotFoundError, { driver: User }>

export class GetUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ driverId }: GetUserRequest): Promise<GetUserResponse> {
    const driver = await this.usersRepository.findById(driverId)

    if (!driver) {
      return left(new DriverNotFoundError(driverId))
    }

    return right({ driver })
  }
}
