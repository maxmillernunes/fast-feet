import { Either, left, right } from '@/core/either'
import { DriverNotFoundError } from './errors/user-not-found-error'
import { UsersRepository } from '../repositories/users-repository'
import { Injectable } from '@nestjs/common'

interface DeleteDeliveryDriverRequest {
  driverId: string
}

type DeleteDeliveryDriverResponse = Either<DriverNotFoundError, null>

@Injectable()
export class DeleteDeliveryDriverByIdUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    driverId,
  }: DeleteDeliveryDriverRequest): Promise<DeleteDeliveryDriverResponse> {
    const driver = await this.usersRepository.findById(driverId)

    if (!driver) {
      return left(new DriverNotFoundError())
    }

    driver.delete()
    await this.usersRepository.save(driver)

    return right(null)
  }
}
