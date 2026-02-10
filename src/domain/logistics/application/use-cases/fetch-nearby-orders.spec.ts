import { makeOrder } from '@test/factories/make-order'
import { makeRecipient } from '@test/factories/make-recipient'
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchNearbyOrdersUseCase } from './fetch-nearby-orders'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: FetchNearbyOrdersUseCase

describe('Fetch Nearby Orders Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new FetchNearbyOrdersUseCase(ordersRepository)
  })

  it('should be able to fetch nearby orders', async () => {
    const recipient = makeRecipient({
      latitude: -23.6821608,
      longitude: -46.5957692,
    })

    await recipientsRepository.create(recipient)

    const order1 = makeOrder({ recipientId: recipient.id })

    const order2 = makeOrder({ recipientId: recipient.id })

    const order3 = makeOrder({ recipientId: recipient.id })

    await ordersRepository.create(order1)
    await ordersRepository.create(order2)
    await ordersRepository.create(order3)

    const result = await sut.execute({
      userLatitude: -23.6821608,
      userLongitude: -46.5957692,
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
        expect.objectContaining({
          id: order3.id,
        }),
      ]),
    })
  })

  it('should not be able to fetch nearby orders when user is too far away', async () => {
    const recipient = makeRecipient({
      latitude: -6.0511893,
      longitude: -38.4534453,
    })

    await recipientsRepository.create(recipient)

    const order1 = makeOrder({ recipientId: recipient.id })

    const order2 = makeOrder({ recipientId: recipient.id })

    const order3 = makeOrder({ recipientId: recipient.id })

    await ordersRepository.create(order1)
    await ordersRepository.create(order2)
    await ordersRepository.create(order3)

    const result = await sut.execute({
      userLatitude: -23.6821608,
      userLongitude: -46.5957692,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      orders: expect.arrayContaining([]),
    })
  })
})
