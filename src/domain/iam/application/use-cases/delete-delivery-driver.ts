import { Either, left, right } from '@/core/either'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface DeleteDeliveryDriverRequest {
  userId: string
}

type DeleteDeliveryDriverResponse = Either<UserNotFoundError, { user: User }>

export class DeleteDeliveryDriverUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: DeleteDeliveryDriverRequest): Promise<DeleteDeliveryDriverResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user || user.role !== UserRole.DELIVERY_DRIVER) {
      return left(new UserNotFoundError(userId))
    }

    user.delete()
    await this.usersRepository.save(user)

    return right({ user })
  }
}
