import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { ListDeliveryDriversUseCase } from './list-delivery-drivers'
import { makeUser } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { InMemoryAdminsRepository } from '@test/repositories/in-memory-admins-repository'
import { InMemoryDeliveryDriversRepository } from '@test/repositories/in-memory-delivery-drivers-repository'
import { makeAdmin } from '@test/factories/make-admin'
import { makeDeliveryDriver } from '@test/factories/make-delivery-driver'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryAdminsRepository: InMemoryAdminsRepository
let inMemoryDeliveryDriversRepository: InMemoryDeliveryDriversRepository
let sut: ListDeliveryDriversUseCase

let user: ReturnType<typeof makeUser>
let admin: ReturnType<typeof makeAdmin>

describe('ListDeliveryDriversUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryAdminsRepository = new InMemoryAdminsRepository()
    inMemoryDeliveryDriversRepository = new InMemoryDeliveryDriversRepository()

    sut = new ListDeliveryDriversUseCase(
      inMemoryAdminsRepository,
      inMemoryDeliveryDriversRepository,
    )

    user = makeUser()
    admin = makeAdmin({ userId: user.id })
  })

  it('should return a paginated list of delivery drivers', async () => {
    await inMemoryUsersRepository.create(user)
    await inMemoryAdminsRepository.create(admin)

    for (let i = 0; i < 25; i++) {
      await inMemoryDeliveryDriversRepository.create(makeDeliveryDriver())
    }

    const result = await sut.execute({
      userId: admin.id.toString(),
      page: 1,
      perPage: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.drivers).toHaveLength(10)
      expect(result.value.total).toBe(25)
      expect(result.value.page).toBe(1)
      expect(result.value.perPage).toBe(10)
    }
  })

  it('should return NotAllowedError when current user is not an admin', async () => {
    const result = await sut.execute({
      userId: 'any-id',
      page: 1,
      perPage: 10,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })
})
