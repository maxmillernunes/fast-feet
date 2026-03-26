import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface GetDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
}

type GetDeliveryDriverResponse = Either<
  NotAllowedError | UserNotFoundError,
  { user: User }
>

export class GetDeliveryDriverUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    deliveryDriverId,
  }: GetDeliveryDriverRequest): Promise<GetDeliveryDriverResponse> {
    const currentUser = await this.usersRepository.findById(userId)
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return left(new NotAllowedError())
    }

    const user = await this.usersRepository.findById(deliveryDriverId)

    if (!user || user.role !== UserRole.DELIVERY_DRIVER) {
      return left(new UserNotFoundError(deliveryDriverId))
    }

    return right({ user })
  }
}
