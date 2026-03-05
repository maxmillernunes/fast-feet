import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { RegisterRecipientUseCase } from './register-recipient'
import { faker } from '@faker-js/faker'
import { makeRecipient } from '@test/factories/make-recipient'
import { ResourceAlreadyExistsError } from '@/core/errors/errors/resource-already-exists-error'

let recipientsRepository: InMemoryRecipientsRepository
let sut: RegisterRecipientUseCase

describe('Register Recipient Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new RegisterRecipientUseCase(recipientsRepository)
  })

  it('should be able to register a new recipient', async () => {
    const result = await sut.execute({
      name: faker.person.fullName(),
      document: faker.string.numeric(11),
      city: faker.location.city(),
      state: faker.location.state(),
      street: faker.location.street(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      latitude: Number(faker.location.latitude()),
      longitude: Number(faker.location.longitude()),
      neighborhood: faker.location.street(),
      complement: faker.location.secondaryAddress(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      recipient: expect.objectContaining({
        name: expect.any(String),
        document: expect.objectContaining({
          value: expect.any(String),
        }),
        city: expect.any(String),
      }),
    })
  })

  it('should not be able to register a new recipient', async () => {
    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      name: faker.person.fullName(),
      document: recipient.document.getValue(),
      city: faker.location.city(),
      state: faker.location.state(),
      street: faker.location.street(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      latitude: Number(faker.location.latitude()),
      longitude: Number(faker.location.longitude()),
      neighborhood: faker.location.street(),
      complement: faker.location.secondaryAddress(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError)
  })
})
