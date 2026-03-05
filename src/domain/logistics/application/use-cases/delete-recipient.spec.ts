import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { DeleteRecipientUseCase } from './delete-recipient'
import { makeRecipient } from '@test/factories/make-recipient'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let recipientsRepository: InMemoryRecipientsRepository
let sut: DeleteRecipientUseCase

describe('Delete Recipient Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new DeleteRecipientUseCase(recipientsRepository)
  })

  it('should be able to delete a recipient', async () => {
    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    const deleted = await recipientsRepository.findById(recipient.id.toString())
    expect(deleted).toBeNull()
  })

  it('should not be able to delete a non-existing recipient', async () => {
    const result = await sut.execute({
      recipientId: 'non-existing-recipient-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
