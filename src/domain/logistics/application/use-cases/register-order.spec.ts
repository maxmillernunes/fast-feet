import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeRecipient } from '@test/factories/make-recipient'
import { RegisterOrderUseCase } from './register-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: RegisterOrderUseCase

describe('Register Order', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new RegisterOrderUseCase(ordersRepository, recipientsRepository)
  })

  it('should be able to register an order', async () => {
    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'CREATED',
        }),
        recipientId: recipient.id,
        createdAt: expect.any(Date),
      }),
    })
  })

  it('should not be able to register an order when recipient does not exists', async () => {
    const result = await sut.execute({
      recipientId: 'non-existing-recipient-id',
    })

    expect(result.isLeft()).toBe(true)

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
