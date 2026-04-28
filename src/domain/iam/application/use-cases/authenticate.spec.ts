import { beforeEach, describe, it, expect } from 'vitest'
import { FakeHasher } from '@test/cryptography/fake-hasher'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { faker } from '@faker-js/faker'
import { AuthenticateUseCase } from './authenticate'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { DEFAULT_PASSWORD, makeUser } from '@test/factories/make-user'
import { FakeEncrypter } from '@test/cryptography/fake-encrypter'

let usersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let encrypt: FakeEncrypter
let sut: AuthenticateUseCase

describe('AuthenticateUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    encrypt = new FakeEncrypter()
    sut = new AuthenticateUseCase(usersRepository, fakeHasher, encrypt)
  })

  it('should authenticate a user with valid credentials', async () => {
    const document = faker.string.numeric(11)
    const user = makeUser({ document: document })
    await usersRepository.create(user)

    const result = await sut.execute({
      login: document,
      password: DEFAULT_PASSWORD,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.document).toBe(document)
    }
  })

  it('should return error for invalid CPF', async () => {
    const result = await sut.execute({
      login: faker.string.numeric(11),
      password: DEFAULT_PASSWORD,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError)
    }
  })

  it('should return error for invalid password', async () => {
    const document = faker.string.numeric(11)
    const user = makeUser({ document: document })
    await usersRepository.create(user)

    const result = await sut.execute({
      login: document,
      password: 'WrongPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError)
    }
  })
})
