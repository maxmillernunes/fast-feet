import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'
import { AdminsRepository } from '../repositories/admins-repository'
import { DeliveryDriversRepository } from '../repositories/delivery-drivers-repository'

interface DeleteDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
}

type DeleteDeliveryDriverResponse = Either<
  NotAllowedError | UserNotFoundError,
  { user: User }
>

export class DeleteDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private adminsRepository: AdminsRepository,
    private deliveryDriversRepository: DeliveryDriversRepository,
  ) {}

  async execute({
    userId,
    deliveryDriverId,
  }: DeleteDeliveryDriverRequest): Promise<DeleteDeliveryDriverResponse> {
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

    user.delete()
    await this.usersRepository.save(user)

    driver.delete()
    await this.deliveryDriversRepository.save(driver)

    return right({ user })
  }
}
