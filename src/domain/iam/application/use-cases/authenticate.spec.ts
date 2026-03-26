import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashComparerInMemory } from '@test/cryptography/hash-comparer-in-memory'
import { makeUser, DEFAULT_PASSWORD } from '@test/factories/make-user'
import { AuthenticateUseCase } from './authenticate'
import { InvalidCredentialsError } from '../../enterprise/entities/errors/invalid-credentials-error'
import { faker } from '@faker-js/faker'

let usersRepository: InMemoryUsersRepository
let hashComparer: HashComparerInMemory
let sut: AuthenticateUseCase

describe('AuthenticateUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashComparer = new HashComparerInMemory()
    sut = new AuthenticateUseCase(usersRepository, hashComparer)
  })

  it('should authenticate a user with valid credentials', async () => {
    const cpf = faker.string.numeric(11)
    const user = makeUser({ cpf })
    await usersRepository.create(user)

    const result = await sut.execute({
      cpf,
      password: DEFAULT_PASSWORD,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.cpf).toBe(cpf)
    }
  })

  it('should return error for invalid CPF', async () => {
    const result = await sut.execute({
      cpf: faker.string.numeric(11),
      password: DEFAULT_PASSWORD,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    }
  })

  it('should return error for invalid password', async () => {
    const cpf = faker.string.numeric(11)
    const user = makeUser({ cpf })
    await usersRepository.create(user)

    const result = await sut.execute({
      cpf,
      password: 'WrongPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    }
  })
})
