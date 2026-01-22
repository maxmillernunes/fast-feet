import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientsRepository } from '../repositories/recipients-repository'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { left, right, type Either } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface RegisterOrderUseCaseRequest {
  adminId: string
  recipientId: string
}

type RegisterOrderUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError,
  {
    order: Order
  }
>

export class RegisterOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private recipientsRepository: RecipientsRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: RegisterOrderUseCaseRequest): Promise<RegisterOrderUseCaseResponse> {
    // Check if the adminId has permission to register orders
    // This is a placeholder for actual permission checking logic
    const isAdmin = adminId ? true : false // Replace with real check
    if (!isAdmin) {
      return left(new NotAllowedError())
    }

    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new ResourceNotFoundError())
    }

    const order = Order.create({
      recipientId: new UniqueEntityId(recipientId),
      status: OrderStatus.create(),
    })

    await this.ordersRepository.create(order)

    return right({ order })
  }
}
