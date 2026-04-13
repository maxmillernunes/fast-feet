import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { makeOrder } from '@test/factories/make-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { MarkOrderAsAwaitingUseCase } from './mark-order-as-awaiting'
import { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { InMemoryOrderAttachmentsRepository } from '@test/repositories/in-memory-order-attachments-repository'
import { InMemoryAttachmentsRepository } from '@test/repositories/in-memory-attachments-repository'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: MarkOrderAsAwaitingUseCase

describe('Mark Order As Awaiting', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
      inMemoryAttachmentsRepository,
      inMemoryRecipientsRepository,
    )
    sut = new MarkOrderAsAwaitingUseCase(inMemoryOrdersRepository)
  })

  it('should be able to mark an order as awaiting', async () => {
    const order = makeOrder({
      status: OrderStatus.create('CREATED'),
    })
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
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
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to mark an order as awaiting when status is WAITING', async () => {
    const order = makeOrder({
      status: OrderStatus.create('WAITING'),
    })
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })

  it('should not be able to mark an order as awaiting when status is PICKED_UP', async () => {
    const order = makeOrder({
      status: OrderStatus.create('PICKED_UP'),
    })
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })

  it('should not be able to mark an order as awaiting when status is DELIVERED', async () => {
    const order = makeOrder({
      status: OrderStatus.create('DELIVERED'),
    })
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })
})
