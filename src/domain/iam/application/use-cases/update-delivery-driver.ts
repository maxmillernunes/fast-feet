import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { DriverNotFoundError } from './errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { Password } from '../../enterprise/entities/values-objects/password'
import { HashGenerator } from '../cryptography/hash-generator'
import { UsersRepository } from '../repositories/users-repository'
import type { User } from '../../enterprise/entities/user'

interface UpdateUserRequest {
  userId: string
  password: string
}

type UpdateUserResponse = Either<
  DriverNotFoundError | InvalidPasswordError | NotAllowedError,
  { driver: User }
>

export class UpdateUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    password,
  }: UpdateUserRequest): Promise<UpdateUserResponse> {
    const driver = await this.usersRepository.findById(userId)

    if (!driver) {
      return left(new DriverNotFoundError(userId))
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
