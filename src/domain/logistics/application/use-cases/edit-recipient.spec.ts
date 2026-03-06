import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { EditRecipientUseCase } from './edit-recipient'
import { faker } from '@faker-js/faker'
import { makeRecipient } from '@test/factories/make-recipient'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DocumentInvalidError } from '../../enterprise/entities/errors/document-invalid-error'

let recipientsRepository: InMemoryRecipientsRepository
let sut: EditRecipientUseCase

describe('Edit Recipient Use Case', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new EditRecipientUseCase(recipientsRepository)
  })

  it('should be able to edit recipient', async () => {
    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const name = faker.person.fullName()
    const document = faker.string.numeric(11)
    const city = faker.location.city()

    const result = await sut.execute({
      id: recipient.id.toString(),
      name,
      document,
      city,
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
        name: name,
        document: expect.objectContaining({
          value: document,
        }),
        city: city,
      }),
    })
  })

  it('should not be able to edit recipient when recipient does not exists', async () => {
    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      id: 'non-existing-id',
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
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit recipient when document is invalid', async () => {
    const recipient = makeRecipient()

    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      id: recipient.id.toString(),
      name: faker.person.fullName(),
      document: 'invalid-document',
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
    expect(result.value).toBeInstanceOf(DocumentInvalidError)
  })
})
