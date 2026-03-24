import { Either, left, right } from '@/core/either'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { Password } from '../../enterprise/entities/values-objects/password'
import { UsersRepository } from '../repositories/users-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { User } from '../../enterprise/entities/user'

interface UpdateDeliveryDriverRequest {
  userId: string
  name?: string
  password?: string
}

type UpdateDeliveryDriverResponse = Either<
  UserNotFoundError | InvalidPasswordError,
  { user: User }
>

export class UpdateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    name,
    password,
  }: UpdateDeliveryDriverRequest): Promise<UpdateDeliveryDriverResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user || user.role !== UserRole.DELIVERY_DRIVER) {
      return left(new UserNotFoundError(userId))
    }

    if (name) {
      user.name = name
    }

    if (password) {
      const passwordResult = Password.create(password)
      if (passwordResult.isLeft()) {
        return left(passwordResult.value)
      }

      const hashedPassword = await this.hashGenerator.generate(password)
      user.password = Password.createWithoutValidation(hashedPassword)
    }

    await this.usersRepository.save(user)

    return right({ user })
  }
}
