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

    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'DELIVERED',
        }),
        deliveredAt: expect.any(Date),
      }),
    })
  })

  it('should not be able to deliver an order when the order does not exists', async () => {
    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: 'non-existing-order-id',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should not be able to deliver an order when status is WAITING', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('WAITING'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
  })
})
