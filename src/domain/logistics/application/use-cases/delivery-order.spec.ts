import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { makeOrder } from '@test/factories/make-order'
import { DeliveryOrderUseCase } from './delivery-order'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToDeliveryError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-delivery-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

let recipientRepository: InMemoryRecipientsRepository
let ordersRepository: InMemoryOrdersRepository
let sut: DeliveryOrderUseCase

describe('Delivery Order', () => {
  beforeEach(() => {
    recipientRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientRepository)
    sut = new DeliveryOrderUseCase(ordersRepository)
  })

  it('should be able to deliver an order', async () => {
    const order = makeOrder({
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
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to deliver an order when status is WAITING', async () => {
    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('WAITING'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToDeliveryError)
  })

  it('should not be able to deliver an order when the delivery driver does not match', async () => {
    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      deliveryDriveId: 'driver-2',
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(DeliveryDriverDoesNotMatchError)
  })
})
