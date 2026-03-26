import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { GetDeliveryDriverUseCase } from './get-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'

let usersRepository: InMemoryUsersRepository
let sut: GetDeliveryDriverUseCase
let admin: ReturnType<typeof makeUser>

describe('GetDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new GetDeliveryDriverUseCase(usersRepository)
    admin = makeUser({ role: UserRole.ADMIN })
  })

  it('should return a delivery driver by id', async () => {
    await usersRepository.create(admin)
    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.id).toEqual(deliveryDriver.id)
    }
  })

  it('should return error when user not found', async () => {
    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: 'non-existent-id',
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return NotAllowedError when current user is not an admin', async () => {
    const nonAdmin = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(nonAdmin)
    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: nonAdmin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return NotAllowedError when current user is not found', async () => {
    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: 'non-existent-id',
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should not return deleted users', async () => {
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

  it('should return UserNotFoundError when target user is not a delivery driver', async () => {
    await usersRepository.create(admin)
    const anotherAdmin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(anotherAdmin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: anotherAdmin.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
