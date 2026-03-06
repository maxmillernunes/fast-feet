import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { makeOrder } from '@test/factories/make-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { DeleteOrderUseCase } from './delete-order'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let ordersRepository: InMemoryOrdersRepository
let recipientRepository: InMemoryRecipientsRepository
let sut: DeleteOrderUseCase

describe('Edit Order Use Case', () => {
  beforeEach(() => {
    recipientRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientRepository)
    sut = new DeleteOrderUseCase(ordersRepository)
  })

  it('should be able to delete an order', async () => {
    const order = makeOrder()
    await ordersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should not be able to edit a non-existing order', async () => {
    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'non-existing-order-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit when the status is different of awaiting order', async () => {
    const order = makeOrder({
      status: OrderStatus.create('DELIVERED'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to edit an order if admin does not have permission', async () => {
    const order = makeOrder()
    await ordersRepository.create(order)

    const result = await sut.execute({
      adminId: '', // Invalid adminId to simulate lack of permission
      orderId: order.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
