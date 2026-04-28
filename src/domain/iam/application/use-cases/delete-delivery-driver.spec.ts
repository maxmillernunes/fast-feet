import { beforeEach, describe, it, expect } from 'vitest'
import { DeleteUserUseCase } from './delete-delivery-driver'
import { DriverNotFoundError } from './errors/user-not-found-error'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { makeUser } from '@test/factories/make-user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: DeleteUserUseCase

describe('DeleteUserUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new DeleteUserUseCase(inMemoryUsersRepository)
  })

  it('should soft delete a delivery driver', async () => {
    const user = makeUser({})
    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      driverId: user.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.driver.isDeleted).toBe(true)
    }

    const deletedUser = inMemoryUsersRepository.items.find((u) =>
      u.id.equals(user.id),
    )

    expect(deletedUser?.isDeleted).toBe(true)
  })

  it('should return error when delivery driver not found', async () => {
    const result = await sut.execute({
      driverId: 'non-existent-id',
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DriverNotFoundError)
    }
  })
})
