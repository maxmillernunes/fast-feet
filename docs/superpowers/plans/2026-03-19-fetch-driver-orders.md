# Fetch Driver Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow delivery drivers to list their orders filtered by status with pagination

**Architecture:** Following existing patterns - add repository method, create use case with tests

**Tech Stack:** TypeScript, NestJS, Vitest

---

## File Structure

| Action | File                                                                     |
| ------ | ------------------------------------------------------------------------ |
| Modify | `src/domain/logistics/application/repositories/orders-repository.ts`     |
| Modify | `test/repositories/in-memory-orders-repository.ts`                       |
| Create | `src/domain/logistics/application/use-cases/fetch-driver-orders.ts`      |
| Create | `src/domain/logistics/application/use-cases/fetch-driver-orders.spec.ts` |

---

## Task 1: Add Repository Method

**Files:**

- Modify: `src/domain/logistics/application/repositories/orders-repository.ts`
- Modify: `test/repositories/in-memory-orders-repository.ts`

- [ ] **Step 1: Add import and method to repository interface**

Add to `orders-repository.ts`:

```typescript
import type { StatusOptions } from '../../enterprise/entities/values-objects/order-status'

abstract findManyByDriver(
  driverId: string,
  status: StatusOptions[],
  params: PaginationParams
): Promise<Order[]>
```

- [ ] **Step 2: Implement method in in-memory repository**

Add to `test/repositories/in-memory-orders-repository.ts`:

```typescript
async findManyByDriver(
  driverId: string,
  status: StatusOptions[],
  { page, perPage }: PaginationParams
): Promise<Order[]> {
  const orders = this.items.filter(order =>
    order.deliveryDriveId?.toString() === driverId &&
    status.includes(order.status.value as StatusOptions)
  )

  const sorted = orders.sort((a, b) =>
    (b.pickedAt?.getTime() ?? 0) - (a.pickedAt?.getTime() ?? 0)
  )

  const start = (page - 1) * perPage
  const end = page * perPage

  return sorted.slice(start, end)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/domain/logistics/application/repositories/orders-repository.ts test/repositories/in-memory-orders-repository.ts
git commit -m "feat: add findManyByDriver to OrdersRepository"
```

---

## Task 2: Create FetchDriverOrders Use Case

**Files:**

- Create: `src/domain/logistics/application/use-cases/fetch-driver-orders.ts`

- [ ] **Step 1: Create the use case**

```typescript
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { StatusOptions } from '../../enterprise/entities/values-objects/order-status'
import type { Order } from '../../enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { Either, right } from '@/core/either'

interface FetchDriverOrdersRequest {
  driverId: string
  status: StatusOptions[]
  page?: number
  perPage?: number
}

type FetchDriverOrdersResponse = Either<null, { orders: Order[] }>

export class FetchDriverOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    driverId,
    status,
    page = 1,
    perPage = 10,
  }: FetchDriverOrdersRequest): Promise<FetchDriverOrdersResponse> {
    const orders = await this.ordersRepository.findManyByDriver(
      driverId,
      status,
      { page, perPage },
    )

    return right({ orders })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/logistics/application/use-cases/fetch-driver-orders.ts
git commit -m "feat: add FetchDriverOrdersUseCase"
```

---

## Task 3: Create Unit Tests

**Files:**

- Create: `src/domain/logistics/application/use-cases/fetch-driver-orders.spec.ts`

- [ ] **Step 1: Write tests**

```typescript
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { FetchDriverOrdersUseCase } from './fetch-driver-orders'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { makeOrder } from '@test/factories/make-order'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- fetch-driver-orders
```

Expected: All 6 tests should pass

- [ ] **Step 3: Commit**

```bash
git add src/domain/logistics/application/use-cases/fetch-driver-orders.spec.ts
git commit -m "test: add FetchDriverOrdersUseCase tests"
```

---

## Verification

After all tasks complete, run full test suite:

```bash
npm test
```

All tests should pass.
