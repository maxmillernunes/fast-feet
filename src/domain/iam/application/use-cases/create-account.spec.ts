import { beforeEach, describe, it, expect } from 'vitest'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { AccountAlreadyExistsError } from '../../enterprise/entities/errors/account-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { faker } from '@faker-js/faker'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { makeUser } from '@test/factories/make-user'
import { InvalidDocumentError } from '../../enterprise/entities/errors/invalid-document-error'
import { CreateAccountUseCase } from './create-account'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryHashGenerator: HashGeneratorInMemory
let sut: CreateAccountUseCase

describe('CreateAccountUseCase', () => {
  let user: ReturnType<typeof makeUser>

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryHashGenerator = new HashGeneratorInMemory()
    sut = new CreateAccountUseCase(
      inMemoryUsersRepository,
      inMemoryHashGenerator,
    )

    user = makeUser()
    inMemoryUsersRepository.items.push(user)
  })

  it('should create a user with valid data', async () => {
    const result = await sut.execute({
      name: faker.person.fullName(),
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          document: expect.any(String),
        }),
      }),
    )
  })

  it('should return error when CPF already exists', async () => {
    const document = faker.string.numeric(11)

    const user = makeUser({ document })
    inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      name: faker.person.fullName(),
      document,
      password: 'ValidPass123!',
      email: faker.internet.email(),
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(AccountAlreadyExistsError)
    }
  })

  it('should return error for invalid password', async () => {
    const result = await sut.execute({
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
})
