import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { UpdateDeliveryDriverUseCase } from './update-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'
import { faker } from '@faker-js/faker'

let usersRepository: InMemoryUsersRepository
let hashGenerator: HashGeneratorInMemory
let sut: UpdateDeliveryDriverUseCase

describe('UpdateDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashGenerator = new HashGeneratorInMemory()
    sut = new UpdateDeliveryDriverUseCase(usersRepository, hashGenerator)
  })

  it('should update delivery driver name', async () => {
    const user = makeUser({ name: 'Old Name' })
    await usersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      name: 'New Name',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.name).toBe('New Name')
    }
  })

  it('should update delivery driver password', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      password: 'NewPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_NewPass123!')
    }
  })

  it('should return error when user not found', async () => {
    const result = await sut.execute({
      userId: 'non-existent-id',
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error for invalid password', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })

  it('should return error when trying to update an admin', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
