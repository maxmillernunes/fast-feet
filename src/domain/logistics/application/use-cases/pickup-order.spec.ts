import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'

import { Order } from '../../enterprise/entities/order'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { PickUpOrderUseCase } from './pickup-order'
import { OrderCanNotTransitionToPickUpError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-pickup-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let recipientsRepository: InMemoryRecipientsRepository
let ordersRepository: InMemoryOrdersRepository
let sut: PickUpOrderUseCase

describe('Pick Up Order', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new PickUpOrderUseCase(ordersRepository)
  })

  it('should be able to pick up an order', async () => {
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

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'PICKED_UP',
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

  it('should not be able to return an order when status is RETURNED', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('RETURNED'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToPickUpError)
  })
})
