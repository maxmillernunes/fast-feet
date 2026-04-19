import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { AdminsRepository } from '../repositories/admins-repository'
import { DeliveryDriversRepository } from '../repositories/delivery-drivers-repository'
import type { DeliveryDriver } from '../../enterprise/entities/delivery-driver'

interface GetDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
}

type GetDeliveryDriverResponse = Either<
  NotAllowedError | UserNotFoundError,
  { driver: DeliveryDriver }
>

export class GetDeliveryDriverUseCase {
  constructor(
    private adminsRepository: AdminsRepository,
    private deliveryDriversRepository: DeliveryDriversRepository,
  ) {}

  async execute({
    userId,
    deliveryDriverId,
  }: GetDeliveryDriverRequest): Promise<GetDeliveryDriverResponse> {
    const isAdmin = await this.adminsRepository.findById(userId)

    if (!isAdmin) {
      return left(new NotAllowedError())
    }

    const driver =
      await this.deliveryDriversRepository.findById(deliveryDriverId)

    if (!driver) {
      return left(new UserNotFoundError(deliveryDriverId))
    }

    return right({ driver })
  }
}
