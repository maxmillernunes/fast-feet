import { makeOrder } from '@test/factories/make-order'
import { makeRecipient } from '@test/factories/make-recipient'

import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchRecentOrdersUseCase } from './fetch-orders-by-recipient-id'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let recipientsRepository: InMemoryRecipientsRepository
let ordersRepository: InMemoryOrdersRepository
let sut: FetchRecentOrdersUseCase

describe('Fetch Orders By RecipientId', () => {
  beforeAll(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new FetchRecentOrdersUseCase(ordersRepository)
  })

  it('should fetch orders by recipient ID', async () => {
    const recipient = makeRecipient()
    const order1 = makeOrder({ recipientId: recipient.id })
    const order2 = makeOrder({ recipientId: recipient.id })

    await ordersRepository.create(order1)
    await ordersRepository.create(order2)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
      page: 1,
      perPage: 10,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      orders: expect.arrayContaining([
        expect.objectContaining({
          id: order1.id,
        }),
        expect.objectContaining({
          id: order2.id,
        }),
      ]),
    })
  })

  it('should return the second page of orders for the recipient ID', async () => {
    const recipient = makeRecipient()

    for (let i = 0; i < 15; i++) {
      const order = makeOrder({
        recipientId: recipient.id,
      })
      await ordersRepository.create(order)
    }

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
      page: 2,
      perPage: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(5)
    }
  })
})
