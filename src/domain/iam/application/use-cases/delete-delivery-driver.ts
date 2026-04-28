import { Either, left, right } from '@/core/either'
import { DriverNotFoundError } from './errors/user-not-found-error'
import type { User } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'

interface DeleteUserRequest {
  driverId: string
}

type DeleteUserResponse = Either<DriverNotFoundError, { driver: User }>

export class DeleteUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ driverId }: DeleteUserRequest): Promise<DeleteUserResponse> {
    const driver = await this.usersRepository.findById(driverId)

    if (!driver) {
      return left(new DriverNotFoundError(driverId))
    }

    driver.delete()
    await this.usersRepository.save(driver)

    return right({ driver })
  }
}
