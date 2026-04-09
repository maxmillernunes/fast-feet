import { left, right, type Either } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrdersRepository } from '../repositories/orders-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

interface DeleteOrderUseCaseRequest {
  adminId: string
  orderId: string
}

type DeleteOrderUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError,
  null
>

export class DeleteOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    adminId,
    orderId,
  }: DeleteOrderUseCaseRequest): Promise<DeleteOrderUseCaseResponse> {
    // TO-DO:
    // Check if the adminId has permission to register orders
    // This is a placeholder for actual permission checking logic
    const isAdmin = adminId ? true : false // Replace with real check
    if (!isAdmin) {
      return left(new NotAllowedError())
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    if (!order.status.isCreated()) {
      return left(new NotAllowedError())
    }

    await this.ordersRepository.delete(order)

    return right(null)
  }
}
