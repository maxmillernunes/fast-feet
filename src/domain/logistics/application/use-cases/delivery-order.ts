import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { OrdersRepository } from '../repositories/orders-repository'
import type { Order } from '../../enterprise/entities/order'

interface DeliveryOrderUseCaseRequest {
  orderId: string
  deliveryDriveId: string
}

interface DeliveryOrderUseCaseResponse {
  order: Order
}

export class DeliveryOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    deliveryDriveId,
    orderId,
  }: DeliveryOrderUseCaseRequest): Promise<DeliveryOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      throw new Error('Order not found.')
    }

    try {
      order.deliver(new UniqueEntityId(deliveryDriveId))
    } catch (error) {
      throw new Error(
        `Failed to deliver order: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    await this.ordersRepository.save(order)

    return {
      order,
    }
  }
}
