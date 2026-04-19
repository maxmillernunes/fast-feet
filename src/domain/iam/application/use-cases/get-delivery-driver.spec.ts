import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { GetDeliveryDriverUseCase } from './get-delivery-driver'
import { makeUser } from '@test/factories/make-user'
import { UserNotFoundError } from '../../enterprise/entities/errors/user-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { InMemoryAdminsRepository } from '@test/repositories/in-memory-admins-repository'
import { InMemoryDeliveryDriversRepository } from '@test/repositories/in-memory-delivery-drivers-repository'
import { makeAdmin } from '@test/factories/make-admin'
import { makeDeliveryDriver } from '@test/factories/make-delivery-driver'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAdminsRepository: InMemoryAdminsRepository
let inMemoryDeliveryDriversRepository: InMemoryDeliveryDriversRepository
let sut: GetDeliveryDriverUseCase

let user: ReturnType<typeof makeUser>
let admin: ReturnType<typeof makeAdmin>

describe('GetDeliveryDriverUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAdminsRepository = new InMemoryAdminsRepository()
    inMemoryDeliveryDriversRepository = new InMemoryDeliveryDriversRepository()

    sut = new GetDeliveryDriverUseCase(
      inMemoryAdminsRepository,
      inMemoryDeliveryDriversRepository,
    )

    user = makeUser()
    admin = makeAdmin({ userId: user.id })
  })

  it('should return a delivery driver by id', async () => {
    await inMemoryUsersRepository.create(user)
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
      expect(result.value.driver.id).toEqual(deliveryDriver.id)
    }
  })

  it('should return NotAllowedError when current user is not an admin', async () => {
    const result = await sut.execute({
      userId: 'any-id',
      deliveryDriverId: 'any-id',
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should not return deleted users', async () => {
    await inMemoryUsersRepository.create(user)
    await inMemoryAdminsRepository.create(admin)

    const userDriver = makeUser()
    await inMemoryUsersRepository.create(userDriver)

    const deliveryDriver = makeDeliveryDriver({
      userId: userDriver.id,
    })
    await inMemoryDeliveryDriversRepository.create(deliveryDriver)

    deliveryDriver.delete()
    await inMemoryDeliveryDriversRepository.save(deliveryDriver)

    const result = await sut.execute({
      userId: admin.id.toString(),
      deliveryDriverId: deliveryDriver.id.toString(),
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
