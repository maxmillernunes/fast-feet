import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { DeliveryOrderUseCase } from './delivery-order'
import { Order, OrderStatus } from '../../enterprise/entities/order'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

let ordersRepository: InMemoryOrdersRepository
let sut: DeliveryOrderUseCase

describe('Delivery Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository()
    sut = new DeliveryOrderUseCase(ordersRepository)
  })

  it('should be able to deliver an order', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.PICKED_UP,
    })
    await ordersRepository.create(order)

    const { order: deliveredOrder } = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
    })

    expect(deliveredOrder.status).toBe('DELIVERED')
    expect(deliveredOrder.deliveredAt).toBeInstanceOf(Date)
  })
})
