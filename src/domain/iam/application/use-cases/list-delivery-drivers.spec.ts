import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'
import { ListDeliveryDriversUseCase } from './list-delivery-drivers'
import { makeUser } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'

let usersRepository: InMemoryUsersRepository
let sut: ListDeliveryDriversUseCase

describe('ListDeliveryDriversUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new ListDeliveryDriversUseCase(usersRepository)
  })

  it('should return a paginated list of delivery drivers', async () => {
    for (let i = 0; i < 25; i++) {
      await usersRepository.create(makeUser({ cpf: faker.string.numeric(11) }))
    }

    const result = await sut.execute({ page: 1, perPage: 10 })

    expect(result.users).toHaveLength(10)
    expect(result.total).toBe(25)
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(10)
  })

  it('should return empty list when no users', async () => {
    const result = await sut.execute({ page: 1, perPage: 10 })

    expect(result.users).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})
