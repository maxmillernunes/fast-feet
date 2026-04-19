import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import type { DeliveryDriver } from '../../enterprise/entities/delivery-driver'
import { AdminsRepository } from '../repositories/admins-repository'
import { DeliveryDriversRepository } from '../repositories/delivery-drivers-repository'

interface ListDeliveryDriversRequest {
  userId: string
  page: number
  perPage: number
}

type ListDeliveryDriversResponse = Either<
  NotAllowedError,
  {
    drivers: DeliveryDriver[]
    total: number
    page: number
    perPage: number
  }
>

export class ListDeliveryDriversUseCase {
  constructor(
    private adminsRepository: AdminsRepository,
    private deliveryDriversRepository: DeliveryDriversRepository,
  ) {}

  async execute({
    userId,
    page,
    perPage,
  }: ListDeliveryDriversRequest): Promise<ListDeliveryDriversResponse> {
    const isAdmin = await this.adminsRepository.findById(userId)

    if (!isAdmin) {
      return left(new NotAllowedError())
    }

    const [drivers, total] = await Promise.all([
      this.deliveryDriversRepository.findMany({ page, perPage }),
      this.deliveryDriversRepository.count(),
    ])

    return right({
      drivers,
      total,
      page,
      perPage,
    })
  }
}
