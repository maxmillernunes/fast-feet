import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'

import { Order } from '../../enterprise/entities/order'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { MarkOrderAsAwaitingUseCase } from './mark-order-as-awaiting'
import { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let recipientsRepository: InMemoryRecipientsRepository
let ordersRepository: InMemoryOrdersRepository
let sut: MarkOrderAsAwaitingUseCase

describe('Mark Order As Awaiting', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new MarkOrderAsAwaitingUseCase(ordersRepository)
  })

  it('should be able to mark an order as awaiting', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('CREATED'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'WAITING',
        }),
        updatedAt: expect.any(Date),
      }),
    })
  })

  it('should not be able to mark an order as awaiting when the order does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to mark an order as awaiting when status is WAITING', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('WAITING'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })

  it('should not be able to mark an order as awaiting when status is PICKED_UP', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })

  it('should not be able to mark an order as awaiting when status is DELIVERED', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('DELIVERED'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })
})
