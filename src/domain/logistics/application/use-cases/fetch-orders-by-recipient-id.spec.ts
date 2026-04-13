import { makeOrder } from '@test/factories/make-order'
import { makeRecipient } from '@test/factories/make-recipient'

import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchRecentOrdersUseCase } from './fetch-orders-by-recipient-id'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { InMemoryOrderAttachmentsRepository } from '@test/repositories/in-memory-order-attachments-repository'
import { InMemoryAttachmentsRepository } from '@test/repositories/in-memory-attachments-repository'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: FetchRecentOrdersUseCase

describe('Fetch Orders By RecipientId', () => {
  beforeAll(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
      inMemoryAttachmentsRepository,
      inMemoryRecipientsRepository,
    )
    sut = new FetchRecentOrdersUseCase(inMemoryOrdersRepository)
  })

  it('should fetch orders by recipient ID', async () => {
    const recipient = makeRecipient()
    const order1 = makeOrder({ recipientId: recipient.id })
    const order2 = makeOrder({ recipientId: recipient.id })

    await inMemoryOrdersRepository.create(order1)
    await inMemoryOrdersRepository.create(order2)

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
      await inMemoryOrdersRepository.create(order)
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
