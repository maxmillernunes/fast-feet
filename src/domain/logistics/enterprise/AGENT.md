# LOGISTICS ENTERPRISE

Entidades, Value Objects e erros específicos do domínio de logística.

---

## COMO CRIAR UMA ENTITY

### Passo 1: Defina os Props

Props são os dados que a entidade carrega.

```typescript
export interface OrderProps {
  recipientId: UniqueEntityId // Quem recebe
  deliveryDriveId?: UniqueEntityId // Quem vai entregar
  status: OrderStatus // Status atual
  createdAt: Date // Quando foi criado
  updatedAt?: Date // Última modificação
  pickedAt?: Date // Quando foi retirado
  deliveredAt?: Date // Quando foi entregue
}
```

### Passo 2: Crie a Classe

```typescript
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { OrderStatus } from './values-objects/order-status'
import { left, right, type Either } from '@/core/either'
import { OrderCanNotTransitionError } from './errors/order-can-not-transition-error'

export class Order extends Entity<OrderProps> {
  // Getters para acessar dados
  get status() {
    return this.props.status
  }

  get deliveryDriveId() {
    return this.props.deliveryDriveId
  }

  // Touch atualiza o updatedAt
  private touch() {
    this.props.updatedAt = new Date()
  }

  // Comportamentos de domínio
  public markAsAwaiting(): Either<OrderCanNotTransitionError, null> {
    if (!this.props.status.canTransitionTo('WAITING')) {
      return left(new OrderCanNotTransitionError())
    }

    this.props.status = OrderStatus.create('WAITING')
    this.touch()

    return right(null)
  }

  // Factory para criar instâncias
  static create(
    props: Optional<OrderProps, 'status' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    const order = new Order(
      {
        ...props,
        status: props.status ?? OrderStatus.create(), // default: CREATED
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return order
  }
}
```

### Regras para Entities

1. **Props são protegidos** → use getters
2. **Use `private touch()`** → atualiza `updatedAt`
3. **Métodos retornam Either** → sucesso ou erro
4. **Use `static create()`** → para criar instâncias

---

## COMO CRIAR UM VALUE OBJECT

Value Objects são imutáveis e comparados por valor.

### Exemplo: OrderStatus

```typescript
import { ValueObject } from '@/core/entities/value-object'

interface OrderStatusProps {
  value: string
}

export class OrderStatus extends ValueObject<OrderStatusProps> {
  // Construtor privado
  private constructor(props: OrderStatusProps) {
    super(props)
  }

  // Factory (única forma de criar)
  static create(status?: string): OrderStatus {
    return new OrderStatus({ value: status ?? 'CREATED' })
  }

  // Método de domínio
  canTransitionTo(target: string): boolean {
    const transitions: Record<string, string[]> = {
      CREATED: ['WAITING'],
      WAITING: ['PICKED_UP'],
      PICKED_UP: ['DELIVERED', 'RETURNED'],
      DELIVERED: [],
      RETURNED: ['WAITING'],
    }
    return transitions[this.value]?.includes(target) ?? false
  }

  // Getter para valor
  get value() {
    return this.props.value
  }
}
```

### Regras para Value Objects

1. **Imutável** → sem setters, métodos retornam novos objetos
2. **Construtor privado** → só cria via `static create()`
3. **Comparado por valor** → `equals()` usa `JSON.stringify(props)`

---

## COMO CRIAR ERROS DE DOMÍNIO

### Estrutura básica

```typescript
// Em: enterprise/entities/errors/order-transition-error.ts

// ❌ Não precisa de import de core
// ❌ Não implemente interfaces
// ✅ Apenas extenda Error

export class OrderCanNotTransitionError extends Error {
  constructor() {
    super('Order must be in CREATED status to be marked as waiting.')
  }
}
```

### Onde criar erros

```
enterprise/
├── entities/
│   ├── order.ts
│   └── errors/
│       ├── order-can-not-transition-error.ts
│       └── delivery-driver-mismatch-error.ts
└── value-objects/
    └── order-status.ts
```

### Padrão da mensagem

Formato: `"Entidade deve estar em STATUS para AÇÃO."`

| Status atual | Status desejado | Mensagem                                                   |
| ------------ | --------------- | ---------------------------------------------------------- |
| CREATED      | WAITING         | "Order must be in CREATED status to be marked as waiting." |
| WAITING      | PICKED_UP       | "Order must be in WAITING status to be picked up."         |
| PICKED_UP    | DELIVERED       | "Order must be in PICKED_UP status to be delivered."       |

---

## TIPO EITHER NOS MÉTODOS

Quando um método pode falhar, retorne Either:

```typescript
type PickUpResult = Either<
  OrderCanNotTransitionError | DriverMismatchError,
  null
>

public pickUp(driverId: UniqueEntityId): PickUpResult {
  // Se não pode transitar
  if (!this.canTransitionTo('PICKED_UP')) {
    return left(new OrderCanNotTransitionError())
  }

  // Se entregador não é o dono
  if (!this.isAssignedTo(driverId)) {
    return left(new DriverMismatchError())
  }

  // Sucesso
  this.props.status = OrderStatus.create('PICKED_UP')
  return right(null)
}
```

### Benefícios

1. **Explícito** → quem usa sabe que pode falhar
2. **Type-safe** → TypeScript ajuda a tratar erros
3. **Composto** → pode encadear validações
