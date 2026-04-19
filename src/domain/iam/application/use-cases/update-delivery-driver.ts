import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { Password } from '../../enterprise/entities/values-objects/password'
import { UsersRepository } from '../repositories/users-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { User } from '../../enterprise/entities/user'
import { AdminsRepository } from '../repositories/admins-repository'
import { DeliveryDriversRepository } from '../repositories/delivery-drivers-repository'

interface UpdateDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
  password: string
}

type UpdateDeliveryDriverResponse = Either<
  UserNotFoundError | InvalidPasswordError | NotAllowedError,
  { user: User }
>

export class UpdateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private adminsRepository: AdminsRepository,
    private deliveryDriversRepository: DeliveryDriversRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    deliveryDriverId,
    password,
  }: UpdateDeliveryDriverRequest): Promise<UpdateDeliveryDriverResponse> {
    const isAdmin = await this.adminsRepository.findById(userId)

    if (!isAdmin) {
      return left(new NotAllowedError())
    }

    const driver =
      await this.deliveryDriversRepository.findById(deliveryDriverId)

    if (!driver) {
      return left(new UserNotFoundError(deliveryDriverId))
    }

    const user = await this.usersRepository.findById(driver.userId.toString())

    if (!user) {
      return left(new UserNotFoundError(deliveryDriverId))
    }

    const passwordResult = Password.createFromText(password)

    if (passwordResult.isLeft()) {
      return left(passwordResult.value)
    }

    const hashedPassword = await this.hashGenerator.generate(password)
    user.password = Password.create(hashedPassword)

    await this.usersRepository.save(user)

    return right({ user })
  }
}
