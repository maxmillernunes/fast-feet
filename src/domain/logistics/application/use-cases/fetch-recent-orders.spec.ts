import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchRecentOrdersUseCase } from './fetch-recent-orders'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeOrder } from '@test/factories/make-order'
import { InMemoryOrderAttachmentsRepository } from '@test/repositories/in-memory-order-attachments-repository'
import { InMemoryAttachmentsRepository } from '@test/repositories/in-memory-attachments-repository'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: FetchRecentOrdersUseCase

describe('Fetch Recent Orders Use Case', () => {
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
    sut = new FetchRecentOrdersUseCase(inMemoryOrdersRepository)
  })

  it('should fetch recent orders with pagination', async () => {
    for (let i = 1; i <= 15; i++) {
      await inMemoryOrdersRepository.create(makeOrder({}))
    }

    const result = await sut.execute({ page: 2, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(5)
    }
  })
})
