import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { ListDeliveryDriversUseCase } from './list-delivery-drivers'
import { makeUser } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let usersRepository: InMemoryUsersRepository
let sut: ListDeliveryDriversUseCase
let admin: ReturnType<typeof makeUser>

describe('ListDeliveryDriversUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new ListDeliveryDriversUseCase(usersRepository)
    admin = makeUser({ role: UserRole.ADMIN })
  })

  it('should return a paginated list of delivery drivers', async () => {
    await usersRepository.create(admin)

    for (let i = 0; i < 25; i++) {
      await usersRepository.create(
        makeUser({
          role: UserRole.DELIVERY_DRIVER,
          cpf: faker.string.numeric(11),
        }),
      )
    }

    const result = await sut.execute({
      userId: admin.id.toString(),
      page: 1,
      perPage: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.users).toHaveLength(10)
      expect(result.value.total).toBe(26)
      expect(result.value.page).toBe(1)
      expect(result.value.perPage).toBe(10)
    }
  })

  it('should return admin when no delivery drivers exist', async () => {
    await usersRepository.create(admin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      page: 1,
      perPage: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.users).toHaveLength(1)
      expect(result.value.total).toBe(1)
    }
  })

  it('should return NotAllowedError when current user is not an admin', async () => {
    const deliveryDriver = makeUser({ role: UserRole.DELIVERY_DRIVER })
    await usersRepository.create(deliveryDriver)

    const result = await sut.execute({
      userId: deliveryDriver.id.toString(),
      page: 1,
      perPage: 10,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return NotAllowedError when current user is not found', async () => {
    const result = await sut.execute({
      userId: 'non-existent-user-id',
      page: 1,
      perPage: 10,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })
})
