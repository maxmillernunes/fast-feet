import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { GetDeliveryDriverUseCase } from './get-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'

let usersRepository: InMemoryUsersRepository
let sut: GetDeliveryDriverUseCase

describe('GetDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new GetDeliveryDriverUseCase(usersRepository)
  })

  it('should return a delivery driver by id', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.id).toEqual(user.id)
    }
  })

  it('should return error when user not found', async () => {
    const result = await sut.execute({ userId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not return deleted users', async () => {
    const user = makeUser()
    await usersRepository.create(user)
    user.delete()
    await usersRepository.save(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
