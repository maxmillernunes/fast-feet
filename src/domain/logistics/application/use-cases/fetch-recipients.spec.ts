import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { FetchRecipientsUseCase } from './fetch-recipients'
import { makeRecipient } from '@test/factories/make-recipient'

let recipientsRepository: InMemoryRecipientsRepository
let sut: FetchRecipientsUseCase

describe('Fetch Recipients Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new FetchRecipientsUseCase(recipientsRepository)
  })

  it('should fetch recipients with pagination', async () => {
    for (let i = 1; i <= 15; i++) {
      await recipientsRepository.create(makeRecipient())
    }

    const result = await sut.execute({ page: 2, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipients).toHaveLength(5)
    }
  })

  it('should fetch recipients with default pagination', async () => {
    await recipientsRepository.create(makeRecipient())
    await recipientsRepository.create(makeRecipient())

    const result = await sut.execute({})

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipients).toHaveLength(2)
    }
  })

  it('should return empty array when there are no recipients', async () => {
    const result = await sut.execute({ page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipients).toHaveLength(0)
    }
  })
})
