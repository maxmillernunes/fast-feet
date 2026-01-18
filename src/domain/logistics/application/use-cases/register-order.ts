import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { RecipientsRepository } from '../repositories/recipients-repository'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'

interface RegisterOrderUseCaseRequest {
  adminId: string
  recipientId: string
}

interface RegisterOrderUseCaseResponse {
  order: Order
}

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
      throw new Error('Unauthorized: Only admins can register orders')
    }

    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      throw new Error('Recipient not found')
    }

    const order = Order.create({
      recipientId: new UniqueEntityId(recipientId),
      status: OrderStatus.create('WAITING'),
    })

    await this.ordersRepository.create(order)

    return { order }
  }
}
