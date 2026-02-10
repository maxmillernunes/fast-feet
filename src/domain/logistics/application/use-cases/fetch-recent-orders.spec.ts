import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchRecentOrdersUseCase } from './fetch-recent-orders'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeOrder } from '@test/factories/make-order'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: FetchRecentOrdersUseCase

describe('Fetch Recent Orders Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new FetchRecentOrdersUseCase(ordersRepository)
  })

  it('should fetch recent orders with pagination', async () => {
    for (let i = 1; i <= 15; i++) {
      await ordersRepository.create(makeOrder({}))
    }

    const result = await sut.execute({ page: 2, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(5)
    }
  })
})
