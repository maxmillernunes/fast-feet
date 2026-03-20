# CORE ENTITIES

Classes base para Domain-Driven Design.

## ENTITY

Objeto com **identidade** (comparado por ID).

```typescript
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface OrderProps {
  // ...
}

export class Order extends Entity<OrderProps> {
  // props são protegidos
  // id é privado com getter

  static create(props: OrderProps, id?: UniqueEntityId) {
    return new Order(props, id)
  }
}
```

**Características:**

- `protected props: Props`
- `private _id: UniqueEntityId`
- `equals()` compara por ID

## VALUE OBJECT

Objeto **imutável**, comparado por **valor**.

```typescript
import { ValueObject } from '@/core/entities/value-object'

export interface OrderStatusProps {
  value: string
}

export class OrderStatus extends ValueObject<OrderStatusProps> {
  // props são protegidos, sem setters

  static create(status?: string): OrderStatus {
    return new OrderStatus({ value: status ?? 'CREATED' })
  }

  canTransitionTo(status: string): boolean {
    // lógica de transição
  }
}
```

**Características:**

- Imutável (sem setters públicos)
- `equals()` compara por `JSON.stringify(props)`

## UNIQUE ENTITY ID

Wrapper para UUID v4.

```typescript
const id = new UniqueEntityId()
const id = new UniqueEntityId('custom-uuid')

id.toString() // "uuid-string"
id.toValue() // "uuid-string"
id.equals(other) // boolean
```
