import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { DeliveryOrderUseCase } from './delivery-order'
import { Order } from '../../enterprise/entities/order'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'

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
      status: OrderStatus.create('PICKED_UP'),
    })
    await ordersRepository.create(order)

    const { order: deliveredOrder } = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
    })

    expect(deliveredOrder.status.value).toBe('DELIVERED')
    expect(deliveredOrder.deliveredAt).toBeInstanceOf(Date)
  })

  it('should not be able to deliver an order when the order does not exists', async () => {
    await expect(() =>
      sut.execute({
        deliveryDriveId: 'driver-1',
        orderId: 'non-existing-order-id',
      }),
    ).rejects.toBeInstanceOf(Error)
  })

  it('should not be able to deliver an order when status is WAITING', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('WAITING'),
    })
    await ordersRepository.create(order)

    await expect(() =>
      sut.execute({
        deliveryDriveId: 'driver-1',
        orderId: order.id.toString(),
      }),
    ).rejects.toBeInstanceOf(Error)
  })
})
