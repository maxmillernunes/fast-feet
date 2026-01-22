import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { RegisterOrderUseCase } from './register-order'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeRecipient } from '@test/factories/orders/make-recipient'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: RegisterOrderUseCase

describe('Register Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository()
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new RegisterOrderUseCase(ordersRepository, recipientsRepository)
  })

  it('should be able to deliver an order', async () => {
    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'WAITING',
        }),
        recipientId: recipient.id,
        createdAt: expect.any(Date),
      }),
    })
  })
})
