# Mark Order as Awaiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ability for admin to mark an order from CREATED to WAITING status

**Architecture:** Simple feature following existing patterns - new error class, new method on Order entity, new use case, and unit tests.

**Tech Stack:** TypeScript, NestJS, Vitest

---

## File Structure

| Action | File                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| Create | `src/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error.ts` |
| Modify | `src/domain/logistics/enterprise/entities/order.ts`                                            |
| Create | `src/domain/logistics/application/use-cases/mark-order-as-awaiting.ts`                         |
| Create | `src/domain/logistics/application/use-cases/mark-order-as-awaiting.spec.ts`                    |

---

## Task 1: Create Error Class

**Files:**

- Create: `src/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error.ts`

- [ ] **Step 1: Create the error class**

```typescript
export class OrderCanNotTransitionToWaitingError extends Error {
  constructor() {
    super('Order must be in CREATED status to be marked as waiting.')
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error.ts
git commit -m "feat: add OrderCanNotTransitionToWaitingError"
```

---

## Task 2: Add markAsAwaiting Method to Order Entity

**Files:**

- Modify: `src/domain/logistics/enterprise/entities/order.ts`

**Prerequisites:** Task 1 complete

- [ ] **Step 1: Add import for the new error**

Add to existing imports section:

```typescript
import { OrderCanNotTransitionToWaitingError } from './errors/order-can-not-transition-to-waiting-error'
```

- [ ] **Step 2: Add AwaitingOrder type**

Add after the existing type definitions (after line 31):

```typescript
type AwaitingOrder = Either<OrderCanNotTransitionToWaitingError, null>
```

- [ ] **Step 3: Add markAsAwaiting method**

Add after the `return()` method (around line 122):

```typescript
public markAsAwaiting(): AwaitingOrder {
  if (!this.props.status.canTransitionTo('WAITING')) {
    return left(new OrderCanNotTransitionToWaitingError())
  }

  this.props.status = OrderStatus.create('WAITING')
  this.touch()

  return right(null)
}
```

- [ ] **Step 4: Run existing tests to verify no regressions**

```bash
npm test -- --testPathPattern="order.spec"
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/logistics/enterprise/entities/order.ts
git commit -m "feat: add markAsAwaiting method to Order entity"
```

---

## Task 3: Create MarkOrderAsAwaiting Use Case

**Files:**

- Create: `src/domain/logistics/application/use-cases/mark-order-as-awaiting.ts`

**Prerequisites:** Task 1 complete

- [ ] **Step 1: Create the use case**

```typescript
import { left, right, type Either } from '@/core/either'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrdersRepository } from '../repositories/orders-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'

interface MarkOrderAsAwaitingUseCaseRequest {
  orderId: string
  adminId: string
}

type MarkOrderAsAwaitingUseCaseResponse = Either<
  OrderCanNotTransitionToWaitingError | ResourceNotFoundError,
  { order: Order }
>

export class MarkOrderAsAwaitingUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
  }: MarkOrderAsAwaitingUseCaseRequest): Promise<MarkOrderAsAwaitingUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    const result = order.markAsAwaiting()

    if (result.isLeft()) {
      return left(result.value)
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/logistics/application/use-cases/mark-order-as-awaiting.ts
git commit -m "feat: add MarkOrderAsAwaitingUseCase"
```

---

## Task 4: Create Unit Tests

**Files:**

- Create: `src/domain/logistics/application/use-cases/mark-order-as-awaiting.spec.ts`

**Prerequisites:** Tasks 1, 2, 3 complete

- [ ] **Step 1: Write tests**

```typescript
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'

import { Order } from '../../enterprise/entities/order'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { MarkOrderAsAwaitingUseCase } from './mark-order-as-awaiting'
import { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'

let recipientsRepository: InMemoryRecipientsRepository
let ordersRepository: InMemoryOrdersRepository
let sut: MarkOrderAsAwaitingUseCase

describe('Mark Order As Awaiting', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
    sut = new MarkOrderAsAwaitingUseCase(ordersRepository)
  })

  it('should be able to mark an order as awaiting', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('CREATED'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'WAITING',
        }),
        updatedAt: expect.any(Date),
      }),
    })
  })

  it('should not be able to mark an order as awaiting when the order does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to mark an order as awaiting when status is WAITING', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('WAITING'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })

  it('should not be able to mark an order as awaiting when status is PICKED_UP', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })

  it('should not be able to mark an order as awaiting when status is DELIVERED', async () => {
    const order = Order.create({
      recipientId: new UniqueEntityId('recipient-1'),
      status: OrderStatus.create('DELIVERED'),
    })
    await ordersRepository.create(order)

    const result = await sut.execute({
      orderId: order.id.toString(),
      adminId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToWaitingError)
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="mark-order-as-awaiting.spec"
```

Expected: All 5 tests should pass

- [ ] **Step 3: Commit**

```bash
git add src/domain/logistics/application/use-cases/mark-order-as-awaiting.spec.ts
git commit -m "test: add MarkOrderAsAwaitingUseCase tests"
```

---

## Verification

After all tasks complete, run full test suite:

```bash
npm test
```

All tests should pass.
