import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchDriverOrdersUseCase } from './fetch-driver-orders'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeOrder } from '@test/factories/make-order'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: FetchDriverOrdersUseCase

describe('Fetch Driver Orders', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new FetchDriverOrdersUseCase(ordersRepository)
  })

  it('should return orders filtered by single status', async () => {
    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      driverId: 'driver-1',
      status: ['PICKED_UP'],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(1)
      expect(result.value.orders[0].status.value).toBe('PICKED_UP')
    }
  })

  it('should return orders filtered by multiple statuses', async () => {
    const order1 = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    const order2 = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('DELIVERED'),
    })
    await ordersRepository.create(order1)
    await ordersRepository.create(order2)

    const result = await sut.execute({
      driverId: 'driver-1',
      status: ['PICKED_UP', 'DELIVERED'],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(2)
    }
  })

  it('should return orders ordered by pickedAt DESC', async () => {
    const order1 = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('WAITING'),
    })
    const order2 = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('WAITING'),
    })

    order1.pickUp(new UniqueEntityId('driver-1'))
    const oldDate = new Date('2024-01-01')
    order1.props.pickedAt = oldDate

    order2.pickUp(new UniqueEntityId('driver-1'))
    const newDate = new Date('2024-01-02')
    order2.props.pickedAt = newDate

    order2.deliver(new UniqueEntityId('driver-1'))

    await ordersRepository.create(order1)
    await ordersRepository.create(order2)

    const result = await sut.execute({
      driverId: 'driver-1',
      status: ['PICKED_UP', 'DELIVERED'],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders[0].status.value).toBe('DELIVERED')
    }
  })

  it('should return empty array when driver has no orders', async () => {
    const result = await sut.execute({
      driverId: 'non-existent-driver',
      status: ['PICKED_UP'],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(0)
    }
  })

  it('should not return orders from other drivers', async () => {
    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-2'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      driverId: 'driver-1',
      status: ['PICKED_UP'],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(0)
    }
  })

  it('should work with pagination', async () => {
    for (let i = 0; i < 15; i++) {
      const order = makeOrder({
        deliveryDriveId: new UniqueEntityId('driver-1'),
        status: OrderStatus.create('PICKED_UP'),
      })
      await ordersRepository.create(order)
    }

    const result = await sut.execute({
      driverId: 'driver-1',
      status: ['PICKED_UP'],
      page: 2,
      perPage: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orders).toHaveLength(5)
    }
  })
})
