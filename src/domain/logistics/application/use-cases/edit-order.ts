import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { left, right, type Either } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientsRepository } from '../repositories/recipients-repository'
import type { Order } from '../../enterprise/entities/order'

interface EditOrderUseCaseRequest {
  orderId: string
  recipientId?: string
}

type EditOrderUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError,
  { order: Order }
>

export class EditOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private recipientsRepository: RecipientsRepository,
  ) {}

  async execute({
    orderId,
    recipientId,
  }: EditOrderUseCaseRequest): Promise<EditOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    if (order.status.isDelivered()) {
      return left(new NotAllowedError())
    }

    if (recipientId) {
      const recipient = await this.recipientsRepository.findById(recipientId)

      if (!recipient) {
        return left(new ResourceNotFoundError())
      }

      order.recipientId = new UniqueEntityId(recipientId)
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
