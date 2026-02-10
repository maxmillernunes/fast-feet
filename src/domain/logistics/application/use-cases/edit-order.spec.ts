import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeRecipient } from '@test/factories/make-recipient'
import { makeOrder } from '@test/factories/make-order'
import { EditOrderUseCase } from './edit-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: EditOrderUseCase

describe('Edit Order Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new EditOrderUseCase(ordersRepository, recipientsRepository)
  })

  it('should be able to edit an order', async () => {
    const order = makeOrder()
    await ordersRepository.create(order)

    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: order.id.toString(),
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        recipientId: recipient.id,
      }),
    })
  })

  it('should not be able to edit a non-existing order', async () => {
    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'non-existing-order-id',
      recipientId: 'recipient-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit an order with non-existing recipient', async () => {
    const order = makeOrder()
    await ordersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: order.id.toString(),
      recipientId: 'non-existing-recipient-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit a delivered order', async () => {
    const order = makeOrder({
      status: OrderStatus.create('DELIVERED'),
    })
    await ordersRepository.create(order)

    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: order.id.toString(),
      recipientId: recipient.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to edit an order if admin does not have permission', async () => {
    const order = makeOrder()
    await ordersRepository.create(order)

    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: '', // Invalid adminId to simulate lack of permission
      orderId: order.id.toString(),
      recipientId: recipient.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
