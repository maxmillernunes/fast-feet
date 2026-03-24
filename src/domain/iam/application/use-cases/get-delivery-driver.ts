import { Either, left, right } from '@/core/either'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface GetDeliveryDriverRequest {
  userId: string
}

type GetDeliveryDriverResponse = Either<UserNotFoundError, { user: User }>

export class GetDeliveryDriverUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: GetDeliveryDriverRequest): Promise<GetDeliveryDriverResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new UserNotFoundError(userId))
    }

    return right({ user })
  }
}
