# LOGISTICS APPLICATION

Use Cases e Repositories deste domínio.

---

## COMO CRIAR UM USE CASE

Use Cases orchestram operações de negócio.

### Estrutura básica

```typescript
// 1. Imports
import { left, right, type Either } from '@/core/either'
import { OrdersRepository } from '../repositories/orders-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { Order } from '../../enterprise/entities/order'

// 2. Interface do request (o que entra)
interface MarkOrderAsAwaitingRequest {
  orderId: string
  adminId: string
}

// 3. Tipo do response (o que sai)
type MarkOrderAsAwaitingResponse = Either<
  ResourceNotFoundError | OrderCanNotTransitionError,
  { order: Order }
>

// 4. Classe do Use Case
export class MarkOrderAsAwaitingUseCase {
  constructor(
    private ordersRepository: OrdersRepository, // Dependency Injection
  ) {}

  async execute({
    orderId,
  }: MarkOrderAsAwaitingRequest): Promise<MarkOrderAsAwaitingResponse> {
    // 1. Buscar dados
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new ResourceNotFoundError())
    }

    // 2. Executar lógica (chamar método do entity)
    const result = order.markAsAwaiting()

    if (result.isLeft()) {
      return left(result.value)
    }

    // 3. Persistir
    await this.ordersRepository.save(order)

    // 4. Retornar sucesso
    return right({ order })
  }
}
```

### Padrões importantes

| Parte           | O que fazer                       |
| --------------- | --------------------------------- |
| **Imports**     | Sempre no topo, paths absolutos   |
| **Request**     | Interface com os dados de entrada |
| **Response**    | `Either<Erro, Sucesso>`           |
| **Constructor** | Recebe repositório via DI         |
| **execute()**   | Método principal, sempre `async`  |

---

## PADRÃO: USE CASE DE LEITURA

Para listagens, retorne sucesso mesmo vazio:

```typescript
type Response = Either<null, { orders: Order[] }>

async execute({ page = 1, perPage = 10 }): Promise<Response> {
  const orders = await this.ordersRepository.findMany({ page, perPage })
  return right({ orders })  // sempre right, mesmo vazio
}
```

### Por que `Either<null, ...>`?

- **null** na esquerda significa "nunca falha"
- `isLeft()` nunca será true
- Simples e direto para o chamador

---

## PADRÃO: USE CASE DE ESCRITA

Para operações que podem falhar:

```typescript
type Response = Either<
  ResourceNotFoundError | OrderCanNotTransitionError,
  { order: Order }
>

async execute({ orderId }): Promise<Response> {
  const order = await this.ordersRepository.findById(orderId)
  if (!order) {
    return left(new ResourceNotFoundError())  // pode falhar
  }

  const result = order.markAsAwaiting()
  if (result.isLeft()) {
    return left(result.value)  // pode falhar
  }

  await this.ordersRepository.save(order)
  return right({ order })  // sucesso
}
```

---

## COMO CRIAR UM REPOSITORY

### Passo 1: Interface (em `application/repositories/`)

```typescript
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Order } from '../../enterprise/entities/order'

export abstract class OrdersRepository {
  // Busca simples
  abstract findById(id: string): Promise<Order | null>

  // Busca com filtros
  abstract findManyRecent(params: PaginationParams): Promise<Order[]>

  abstract findManyByDriver(
    driverId: string,
    status: StatusOptions[],
    params: PaginationParams,
  ): Promise<Order[]>

  // Persistência
  abstract create(order: Order): Promise<void>
  abstract save(order: Order): Promise<void>
  abstract delete(order: Order): Promise<void>
}
```

### Passo 2: Implementação In-Memory (para testes)

```typescript
// Em: test/repositories/in-memory-orders-repository.ts

export class InMemoryOrdersRepository implements OrdersRepository {
  public items: Order[] = []

  async findById(id: string): Promise<Order | null> {
    return this.items.find((order) => order.id.toString() === id) ?? null
  }

  async findManyRecent({ page, perPage }: PaginationParams): Promise<Order[]> {
    const start = (page - 1) * perPage
    const end = page * perPage

    return this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, end)
  }

  async save(order: Order): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(order.id))
    this.items[index] = order
  }

  async create(order: Order): Promise<void> {
    this.items.push(order)
  }

  async delete(order: Order): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(order.id))
  }
}
```

### Regras para Repositories

1. **Interface primeiro** → define o contrato
2. **Implementação separada** → para testes, use in-memory
3. **Métodos sempre `async`** → mesmo no in-memory
4. **Retornar `null`** → quando não encontrar

---

## ESTRUTURA DE TESTES

Todo use case tem seu teste na **mesma pasta**:

```
use-cases/
├── register-order.ts           # Use Case
└── register-order.spec.ts      # Teste
```

### Padrão de teste

```typescript
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { makeOrder } from '@test/factories/make-order'
import { RegisterOrderUseCase } from './register-order'

let ordersRepository: InMemoryOrdersRepository
let sut: RegisterOrderUseCase

describe('Register Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository(/* ... */)
    sut = new RegisterOrderUseCase(ordersRepository)
  })

  it('should create an order', async () => {
    // Arrange
    const order = makeOrder({ status: OrderStatus.create('CREATED') })
    await ordersRepository.create(order)

    // Act
    const result = await sut.execute({ orderId: order.id.toString() })

    // Assert
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.order.status.value).toBe('WAITING')
    }
  })

  it('should fail when order not found', async () => {
    const result = await sut.execute({ orderId: 'invalid-id' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
```

### Ordem do teste: AAA

1. **Arrange** → setup, criar dados
2. **Act** → executar a ação
3. **Assert** → verificar resultado

---

## PADRÃO DE PERMISSÕES

| Tipo de Use Case         | Quem pode executar |
| ------------------------ | ------------------ |
| Criar, Editar, Deletar   | Admin              |
| Marcar como WAITING      | Admin              |
| Pick Up, Deliver, Return | Entregador         |
| Fetch (listar)           | Ambos              |

### adminId vs driverId

```typescript
// Admin operations
interface RegisterOrderRequest {
  adminId: string // opcional por enquanto
  recipientId: string
}

// Driver operations
interface PickUpOrderRequest {
  driverId: string // obrigatório
  orderId: string
}
```
