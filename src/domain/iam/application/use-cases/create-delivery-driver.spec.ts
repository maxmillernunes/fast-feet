import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { CreateDeliveryDriverUseCase } from './create-delivery-driver'
import { UserAlreadyExistsError } from '../../enterprise/entities/errors/user-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { makeUser } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'
import { InMemoryAdminsRepository } from '@test/repositories/in-memory-admins-repository'
import { InMemoryDeliveryDriversRepository } from '@test/repositories/in-memory-delivery-drivers-repository'
import { makeAdmin } from '@test/factories/make-admin'
import { InvalidDocumentError } from '../../enterprise/entities/errors/invalid-document-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAdminsRepository: InMemoryAdminsRepository
let inMemoryDeliveryDriversRepository: InMemoryDeliveryDriversRepository
let inMemoryHashGenerator: HashGeneratorInMemory
let sut: CreateDeliveryDriverUseCase

describe('CreateDeliveryDriverUseCase', () => {
  let user: ReturnType<typeof makeUser>
  let admin: ReturnType<typeof makeAdmin>

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAdminsRepository = new InMemoryAdminsRepository()
    inMemoryDeliveryDriversRepository = new InMemoryDeliveryDriversRepository()
    inMemoryHashGenerator = new HashGeneratorInMemory()
    sut = new CreateDeliveryDriverUseCase(
      inMemoryUsersRepository,
      inMemoryAdminsRepository,
      inMemoryDeliveryDriversRepository,
      inMemoryHashGenerator,
    )

    user = makeUser()
    inMemoryUsersRepository.items.push(user)
    admin = makeAdmin()
    inMemoryAdminsRepository.items.push(admin)
  })

  it('should create a delivery driver with valid data', async () => {
    const result = await sut.execute({
      userId: admin.id.toString(),
      name: faker.person.fullName(),
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          login: expect.any(String),
        }),
      }),
    )
  })

  it('should return error when CPF already exists', async () => {
    const document = faker.string.numeric(11)
    await inMemoryUsersRepository.create(makeUser({ login: document }))

    const result = await sut.execute({
      userId: admin.id.toString(),
      name: faker.person.fullName(),
      document,
      password: 'ValidPass123!',
      email: faker.internet.email(),
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
    }
  })

  it('should return error for invalid password', async () => {
    const result = await sut.execute({
      userId: admin.id.toString(),
      name: faker.person.fullName(),
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })

  it('should return error for invalid CPF format', async () => {
    const result = await sut.execute({
      userId: admin.id.toString(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      document: '123',
      password: 'ValidPass123!',
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidDocumentError)
    }
  })

  it('should hash the password', async () => {
    const document = faker.string.numeric(11)

    const result = await sut.execute({
      userId: admin.id.toString(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      document,
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_ValidPass123!')
    }
  })

  it('should not be able to create a delivery driver if user is not admin', async () => {
    const result = await sut.execute({
      userId: 'non-admin',
      name: 'John Doe',
      document: '12345678909',
      email: 'johndoe@gmail.com',
      password: 'password123!',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
