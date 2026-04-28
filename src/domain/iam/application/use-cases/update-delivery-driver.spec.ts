import { beforeEach, describe, it, expect } from 'vitest'
import { FakeHasher } from '@test/cryptography/fake-hasher'
import { UpdateUserUseCase } from './update-delivery-driver'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'

import { makeUser } from '@test/factories/make-user'

let inMemoryUsersRepository: InMemoryUsersRepository
let fakeHasher: FakeHasher
let sut: UpdateUserUseCase

describe('UpdateUserUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeHasher = new FakeHasher()
    sut = new UpdateUserUseCase(inMemoryUsersRepository, fakeHasher)
  })

  it('should update delivery driver password', async () => {
    const driver = makeUser()
    await inMemoryUsersRepository.create(driver)

    const result = await sut.execute({
      userId: driver.id.toString(),
      password: 'NewPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.driver.password.value).toBe('hashed_NewPass123!')
    }
  })

  it('should return error for invalid password', async () => {
    const driver = makeUser()
    await inMemoryUsersRepository.create(driver)

    const result = await sut.execute({
      userId: driver.id.toString(),
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })
})
