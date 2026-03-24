import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { DeleteDeliveryDriverUseCase } from './delete-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'

let usersRepository: InMemoryUsersRepository
let sut: DeleteDeliveryDriverUseCase

describe('DeleteDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new DeleteDeliveryDriverUseCase(usersRepository)
  })

  it('should soft delete a delivery driver', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.isDeleted).toBe(true)
    }

    const deletedUser = usersRepository.users.find((u) => u.id.equals(user.id))
    expect(deletedUser?.isDeleted).toBe(true)
  })

  it('should return error when user not found', async () => {
    const result = await sut.execute({ userId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error when user already deleted', async () => {
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

  it('should return error when trying to delete an admin', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const result = await sut.execute({ userId: admin.id.toString() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
