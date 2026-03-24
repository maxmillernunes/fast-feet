import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { CreateDeliveryDriverUseCase } from './create-delivery-driver'
import { InvalidCpfError } from '../../enterprise/errors/invalid-cpf-error'
import { UserAlreadyExistsError } from '../../enterprise/errors/user-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'
import { makeUser } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'

let usersRepository: InMemoryUsersRepository
let hashGenerator: HashGeneratorInMemory
let sut: CreateDeliveryDriverUseCase

describe('CreateDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashGenerator = new HashGeneratorInMemory()
    sut = new CreateDeliveryDriverUseCase(usersRepository, hashGenerator)
  })

  it('should create a delivery driver with valid data', async () => {
    const name = faker.person.fullName()
    const cpf = faker.string.numeric(11)

    const result = await sut.execute({
      name,
      cpf,
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.name).toBe(name)
      expect(result.value.user.cpf).toBe(cpf)
    }
  })

  it('should return error when CPF already exists', async () => {
    const cpf = faker.string.numeric(11)
    await usersRepository.create(makeUser({ cpf }))

    const result = await sut.execute({
      name: faker.person.fullName(),
      cpf,
      password: 'ValidPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
    }
  })

  it('should return error for invalid password', async () => {
    const result = await sut.execute({
      name: faker.person.fullName(),
      cpf: faker.string.numeric(11),
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
      cpf: '123',
      password: 'ValidPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCpfError)
    }
  })

  it('should hash the password', async () => {
    const cpf = faker.string.numeric(11)

    const result = await sut.execute({
      name: faker.person.fullName(),
      cpf,
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_ValidPass123!')
    }
  })
})
