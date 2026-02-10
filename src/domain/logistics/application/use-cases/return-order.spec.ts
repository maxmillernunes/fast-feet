import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'

import { Order } from '../../enterprise/entities/order'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { DeliveryDriverDoesNotMatchError } from '../../enterprise/entities/errors/delivery-driver-does-not-match-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ReturnOrderUseCase } from './return-order'
import { OrderCanNotTransitionToReturnedError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-returned-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: ReturnOrderUseCase

describe('Return Order', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new ReturnOrderUseCase(ordersRepository)
  })

  it('should be able to return an order', async () => {
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
          value: 'RETURNED',
        }),
        updatedAt: expect.any(Date),
      }),
    })
  })

  it('should not be able to return an order when the order does not exists', async () => {
    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: 'non-existing-order-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to return an order when status is WAITING', async () => {
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
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToReturnedError)
  })

  it('should not be able to return an order when the delivery driver does not match', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
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
