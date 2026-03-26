import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { CreateDeliveryDriverUseCase } from './create-delivery-driver'
import { InvalidCpfError } from '../../enterprise/entities/errors/invalid-cpf-error'
import { UserAlreadyExistsError } from '../../enterprise/entities/errors/user-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { makeUser } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'

let usersRepository: InMemoryUsersRepository
let hashGenerator: HashGeneratorInMemory
let sut: CreateDeliveryDriverUseCase

describe('CreateDeliveryDriverUseCase', () => {
  let admin: ReturnType<typeof makeUser>

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashGenerator = new HashGeneratorInMemory()
    sut = new CreateDeliveryDriverUseCase(usersRepository, hashGenerator)

    admin = makeUser({ role: UserRole.ADMIN })
    usersRepository.users.push(admin)
  })

  it('should create a delivery driver with valid data', async () => {
    const name = faker.person.fullName()
    const cpf = faker.string.numeric(11)

    const result = await sut.execute({
      userId: admin.id.toString(),
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
      userId: admin.id.toString(),
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
      userId: admin.id.toString(),
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
      userId: admin.id.toString(),
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
      userId: admin.id.toString(),
      name: faker.person.fullName(),
      cpf,
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_ValidPass123!')
    }
  })

  it('should not be able to create a delivery driver if user is not admin', async () => {
    const nonAdmin = makeUser({ role: UserRole.DELIVERY_DRIVER })
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(nonAdmin)

    const result = await sut.execute({
      userId: nonAdmin.id.toString(),
      name: 'John Doe',
      cpf: '12345678909',
      password: 'password123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should return NotAllowedError when current user is not found', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(null)

    const result = await sut.execute({
      userId: 'non-existent-id',
      name: 'John Doe',
      cpf: '12345678909',
      password: 'password123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
