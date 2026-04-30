import { beforeEach, describe, it, expect } from 'vitest'
import { FetchUsersUseCase } from './fetch-delivery-drivers'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users-repository'

import { makeUser } from '@test/factories/make-user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: FetchUsersUseCase

describe('FetchUsersUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()

    sut = new FetchUsersUseCase(inMemoryUsersRepository)
  })

  it('should return a paginated fetch of delivery drivers', async () => {
    for (let i = 0; i < 25; i++) {
      await inMemoryUsersRepository.create(makeUser())
    }

    const result = await sut.execute({
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
})
