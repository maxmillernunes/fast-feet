import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { DeleteDeliveryDriverUseCase } from './delete-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { InMemoryDeliveryDriversRepository } from '@test/repositories/in-memory-delivery-drivers-repository'
import { InMemoryAdminsRepository } from '@test/repositories/in-memory-admins-repository'
import { makeAdmin } from '@test/factories/make-admin'
import { makeDeliveryDriver } from '@test/factories/make-delivery-driver'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAdminsRepository: InMemoryAdminsRepository
let inMemoryDeliveryDriversRepository: InMemoryDeliveryDriversRepository
let sut: DeleteDeliveryDriverUseCase

describe('DeleteDeliveryDriverUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAdminsRepository = new InMemoryAdminsRepository()
    inMemoryDeliveryDriversRepository = new InMemoryDeliveryDriversRepository()
    sut = new DeleteDeliveryDriverUseCase(
      inMemoryUsersRepository,
      inMemoryAdminsRepository,
      inMemoryDeliveryDriversRepository,
    )
  })

  it('should soft delete a delivery driver', async () => {
    const user = makeUser()
    await inMemoryUsersRepository.create(user)

    const admin = makeAdmin({ userId: user.id })
    await inMemoryAdminsRepository.create(admin)

    const userDriver = makeUser()
    await inMemoryUsersRepository.create(userDriver)

    const deliveryDriver = makeDeliveryDriver({
      userId: userDriver.id,
    })
    await inMemoryDeliveryDriversRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.isDeleted).toBe(true)
    }

    const deletedUser = inMemoryUsersRepository.items.find((u) =>
      u.id.equals(deliveryDriver.userId),
    )

    expect(deletedUser?.isDeleted).toBe(true)
  })

  it('should return NotAllowedError when current user is not an admin', async () => {
    const userDriver = makeUser()
    await inMemoryUsersRepository.create(userDriver)

    const deliveryDriver = makeDeliveryDriver({
      userId: userDriver.id,
    })
    await inMemoryDeliveryDriversRepository.create(deliveryDriver)

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
    const user = makeUser()
    await inMemoryUsersRepository.create(user)

    const admin = makeAdmin({ userId: user.id })
    await inMemoryAdminsRepository.create(admin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: 'non-existent-id',
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
