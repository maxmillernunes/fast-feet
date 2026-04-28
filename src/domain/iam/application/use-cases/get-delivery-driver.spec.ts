import { beforeEach, describe, it, expect } from 'vitest'
import { GetUserUseCase } from './get-delivery-driver'
import { DriverNotFoundError } from './errors/user-not-found-error'

import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { makeUser } from '@test/factories/make-user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: GetUserUseCase

describe('GetUserUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()

    sut = new GetUserUseCase(inMemoryUsersRepository)
  })

  it('should return a delivery driver by id', async () => {
    const user = makeUser({})
    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      driverId: user.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.driver.id).toEqual(user.id)
    }
  })

  it('should not return deleted users', async () => {
    const user = makeUser({})
    await inMemoryUsersRepository.create(user)

    user.delete()
    await inMemoryUsersRepository.save(user)

    const result = await sut.execute({
      driverId: user.id.toString(),
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DriverNotFoundError)
    }
  })
})
