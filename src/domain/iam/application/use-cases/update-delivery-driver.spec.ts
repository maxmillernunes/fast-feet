import { beforeEach, describe, it, expect, vi } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@test/cryptography/hash-generator-in-memory'
import { UpdateDeliveryDriverUseCase } from './update-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { faker } from '@faker-js/faker'
import { InMemoryAdminsRepository } from '@test/repositories/in-memory-admins-repository'
import { InMemoryDeliveryDriversRepository } from '@test/repositories/in-memory-delivery-drivers-repository'
import { makeAdmin } from '@test/factories/make-admin'
import { makeDeliveryDriver } from '@test/factories/make-delivery-driver'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAdminsRepository: InMemoryAdminsRepository
let inMemoryDeliveryDriversRepository: InMemoryDeliveryDriversRepository
let inMemoryHashGenerator: HashGeneratorInMemory
let sut: UpdateDeliveryDriverUseCase

let user: ReturnType<typeof makeUser>
let admin: ReturnType<typeof makeAdmin>

describe('UpdateDeliveryDriverUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAdminsRepository = new InMemoryAdminsRepository()
    inMemoryDeliveryDriversRepository = new InMemoryDeliveryDriversRepository()
    inMemoryHashGenerator = new HashGeneratorInMemory()
    sut = new UpdateDeliveryDriverUseCase(
      inMemoryUsersRepository,
      inMemoryAdminsRepository,
      inMemoryDeliveryDriversRepository,
      inMemoryHashGenerator,
    )

    user = makeUser()
    admin = makeAdmin({ userId: user.id })
  })

  it('should update delivery driver password', async () => {
    await inMemoryUsersRepository.create(user)
    await inMemoryAdminsRepository.create(admin)

    const userDriver = makeUser()
    await inMemoryUsersRepository.create(userDriver)
    const driver = makeDeliveryDriver({ userId: userDriver.id })
    await inMemoryDeliveryDriversRepository.create(driver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: driver.id.toString(),
      password: 'NewPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_NewPass123!')
    }
  })

  it('should return error when user not found', async () => {
    const userDriver = makeUser()
    await inMemoryUsersRepository.create(userDriver)
    const driver = makeDeliveryDriver({ userId: userDriver.id })
    await inMemoryDeliveryDriversRepository.create(driver)

    const result = await sut.execute({
      userId: 'non-exists-id',
      deliveryDriverId: 'non-existent-id',
      password: 'some-password',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return error for invalid password', async () => {
    await inMemoryUsersRepository.create(user)
    await inMemoryAdminsRepository.create(admin)

    const userDriver = makeUser()
    await inMemoryUsersRepository.create(userDriver)
    const driver = makeDeliveryDriver({ userId: userDriver.id })
    await inMemoryDeliveryDriversRepository.create(driver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: driver.id.toString(),
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })

  it('should return NotAllowedError when current user is not found', async () => {
    await inMemoryUsersRepository.create(user)
    await inMemoryAdminsRepository.create(admin)

    const driver = makeDeliveryDriver()
    await inMemoryDeliveryDriversRepository.create(driver)

    const result = await sut.execute({
      userId: 'non-existent-id',
      deliveryDriverId: driver.id.toString(),
      password: 'NewPass123!',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
