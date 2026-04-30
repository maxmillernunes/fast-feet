import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { DriverNotFoundError } from './errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { Password } from '../../enterprise/entities/values-objects/password'
import { HashGenerator } from '../cryptography/hash-generator'
import { UsersRepository } from '../repositories/users-repository'
import type { User } from '../../enterprise/entities/user'
import { Injectable } from '@nestjs/common'

interface UpdateDeliveryDriverRequest {
  driverId: string
  password: string
}

type UpdateDeliveryDriverResponse = Either<
  DriverNotFoundError | InvalidPasswordError | NotAllowedError,
  { driver: User }
>

@Injectable()
export class UpdateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    driverId,
    password,
  }: UpdateDeliveryDriverRequest): Promise<UpdateDeliveryDriverResponse> {
    const driver = await this.usersRepository.findById(driverId)

    if (!driver) {
      return left(new DriverNotFoundError())
    }

    const passwordResult = Password.createFromText(password)

    if (passwordResult.isLeft()) {
      return left(passwordResult.value)
    }

    const hashedPassword = await this.hashGenerator.hash(password)
    driver.password = Password.create(hashedPassword)

    await this.usersRepository.save(driver)

    return right({ driver })
  }
}
