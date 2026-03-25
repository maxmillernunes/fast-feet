import { beforeEach, describe, it, expect, vi } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { UpdateDeliveryDriverUseCase } from './update-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { faker } from '@faker-js/faker'

let usersRepository: InMemoryUsersRepository
let hashGenerator: HashGeneratorInMemory
let sut: UpdateDeliveryDriverUseCase

describe('UpdateDeliveryDriverUseCase', () => {
  let admin: ReturnType<typeof makeUser>
  let deliveryDriver: ReturnType<typeof makeUser>

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashGenerator = new HashGeneratorInMemory()
    sut = new UpdateDeliveryDriverUseCase(usersRepository, hashGenerator)

    admin = makeUser({ role: UserRole.ADMIN })
    deliveryDriver = makeUser({
      role: UserRole.DELIVERY_DRIVER,
      name: 'Old Name',
    })
  })

  it('should update delivery driver name', async () => {
    await usersRepository.create(admin)
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
      name: 'New Name',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.name).toBe('New Name')
    }
  })

  it('should update delivery driver password', async () => {
    await usersRepository.create(admin)
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
      password: 'NewPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_NewPass123!')
    }
  })

  it('should return error when user not found', async () => {
    await usersRepository.create(admin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: 'non-existent-id',
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error for invalid password', async () => {
    await usersRepository.create(admin)
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })

  it('should return error when trying to update an admin', async () => {
    await usersRepository.create(admin)
    const adminTarget = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(adminTarget)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: adminTarget.id.toString(),
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not be able to update a delivery driver if user is not admin', async () => {
    const nonAdmin = makeUser({ role: UserRole.DELIVERY_DRIVER })
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(nonAdmin)

    const result = await sut.execute({
      userId: nonAdmin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should return NotAllowedError when current user is not found', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(null)

    const result = await sut.execute({
      userId: 'non-existent-id',
      deliveryDriverId: deliveryDriver.id.toString(),
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
