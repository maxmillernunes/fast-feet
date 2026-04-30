import { Either, left, right } from '@/core/either'
import { DriverNotFoundError } from './errors/user-not-found-error'
import { UsersRepository } from '../repositories/users-repository'
import type { User } from '../../enterprise/entities/user'
import { Injectable } from '@nestjs/common'

interface GetDeliveryDriverByIdRequest {
  driverId: string
}

type GetDeliveryDriverByIdResponse = Either<
  DriverNotFoundError,
  { driver: User }
>

@Injectable()
export class GetDeliveryDriverByIdUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    driverId,
  }: GetDeliveryDriverByIdRequest): Promise<GetDeliveryDriverByIdResponse> {
    const driver = await this.usersRepository.findById(driverId)

    if (!driver) {
      return left(new DriverNotFoundError())
    }

    return right({ driver })
  }
}
