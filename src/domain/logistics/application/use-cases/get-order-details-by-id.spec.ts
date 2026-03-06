import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeOrder } from '@test/factories/make-order'
import { makeRecipient } from '@test/factories/make-recipient'
import { GetOrderDetailsByIdUseCase } from './get-order-details-by-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: GetOrderDetailsByIdUseCase

describe('Get Order Details By ID', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new GetOrderDetailsByIdUseCase(ordersRepository)
  })

  it('should be able to get order details with recipient by id', async () => {
    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const order = makeOrder({ recipientId: recipient.id })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        id: order.id,
        recipient: expect.objectContaining({
          id: recipient.id,
          name: recipient.name,
          zipCode: recipient.zipCode,
          state: recipient.state,
          city: recipient.city,
          street: recipient.street,
          neighborhood: recipient.neighborhood,
          complement: recipient.complement,
        }),
      }),
    })
  })

  it('should not be able to get order details when order does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
