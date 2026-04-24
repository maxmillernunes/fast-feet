import { beforeEach, describe, it, expect } from 'vitest'
import { HashComparerInMemory } from '@test/cryptography/hash-comparer-in-memory'
import { InvalidCredentialsError } from '../../enterprise/entities/errors/invalid-credentials-error'
import { faker } from '@faker-js/faker'
import { AuthenticateUseCase } from './authenticate'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { DEFAULT_PASSWORD, makeUser } from '@test/factories/make-user'

let adminsRepository: InMemoryUsersRepository
let hashComparer: HashComparerInMemory
let sut: AuthenticateUseCase

describe('AuthenticateUseCase', () => {
  beforeEach(() => {
    adminsRepository = new InMemoryUsersRepository()
    hashComparer = new HashComparerInMemory()
    sut = new AuthenticateUseCase(adminsRepository, hashComparer)
  })

  it('should authenticate a admin with valid credentials', async () => {
    const document = faker.string.numeric(11)
    const user = makeUser({ document: document })
    await adminsRepository.create(user)

    const result = await sut.execute({
      login: document,
      password: DEFAULT_PASSWORD,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.admin.document).toBe(document)
    }
  })

  it('should return error for invalid CPF', async () => {
    const result = await sut.execute({
      login: faker.string.numeric(11),
      password: DEFAULT_PASSWORD,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    }
  })

  it('should return error for invalid password', async () => {
    const document = faker.string.numeric(11)
    const user = makeUser({ document: document })
    await adminsRepository.create(user)

    const result = await sut.execute({
      login: document,
      password: 'WrongPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    }
  })
})
