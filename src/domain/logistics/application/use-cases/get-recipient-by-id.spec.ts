import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { GetRecipientByIdUseCase } from './get-recipient-by-id'
import { makeRecipient } from '@test/factories/make-recipient'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let recipientsRepository: InMemoryRecipientsRepository
let sut: GetRecipientByIdUseCase

describe('Get Recipient By ID Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new GetRecipientByIdUseCase(recipientsRepository)
  })

  it('should be able to get recipient by id', async () => {
    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.recipient.id.toString()).toBe(recipient.id.toString())
      expect(result.value.recipient.name).toBe(recipient.name)
      expect(result.value.recipient.city).toBe(recipient.city)
    }
  })

  it('should not be able to get recipient when recipient does not exist', async () => {
    const result = await sut.execute({
      recipientId: 'non-existing-recipient-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
