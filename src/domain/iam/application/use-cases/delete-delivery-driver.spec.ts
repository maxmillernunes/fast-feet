import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { DeleteDeliveryDriverUseCase } from './delete-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let usersRepository: InMemoryUsersRepository
let sut: DeleteDeliveryDriverUseCase

describe('DeleteDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new DeleteDeliveryDriverUseCase(usersRepository)
  })

  it('should soft delete a delivery driver', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.isDeleted).toBe(true)
    }

    const deletedUser = usersRepository.users.find((u) =>
      u.id.equals(deliveryDriver.id),
    )
    expect(deletedUser?.isDeleted).toBe(true)
  })

  it('should return NotAllowedError when current user is not an admin', async () => {
    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: deliveryDriver.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return NotAllowedError when current user is not found', async () => {
    const result = await sut.execute({
      userId: 'non-existent-user-id',
      deliveryDriverId: 'any-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return error when delivery driver not found', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: 'non-existent-id',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error when delivery driver already deleted', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)
    deliveryDriver.delete()
    await usersRepository.save(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error when trying to delete an admin', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const otherAdmin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(otherAdmin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: otherAdmin.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
