# Design: Listar Encomendas do Entregador

**Data:** 2026-03-19  
**Status:** Aprovado

## Objetivo

Permitir que um entregador liste as encomendas associadas a ele, filtradas por status.

## Decisões de Design

- **Paginação:** Sim, seguindo o padrão existente de `fetch-recent-orders`
- **Filtro por status:** Array de `StatusOptions` para flexibilidade
- **Ordenação:** Por `pickedAt` DESC (quando o entregador retirou)

## Estrutura de Arquivos

### Arquivos Modificados

```
src/domain/logistics/application/repositories/orders-repository.ts
test/repositories/in-memory-orders-repository.ts
```

### Novos Arquivos

```
src/domain/logistics/application/use-cases/fetch-driver-orders.ts
src/domain/logistics/application/use-cases/fetch-driver-orders.spec.ts
```

## Implementação

### 1. Repository Interface (`orders-repository.ts`)

Adicionar método:

```typescript
abstract findManyByDriver(
  driverId: string,
  status: StatusOptions[],
  params: PaginationParams
): Promise<Order[]>
```

### 2. In-Memory Repository (`in-memory-orders-repository.ts`)

Implementar método:

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

### 3. Use Case (`fetch-driver-orders.ts`)

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

### 4. Testes (`fetch-driver-orders.spec.ts`)

Casos de teste:

- Deve retornar ordens filtradas por status único
- Deve retornar ordens filtradas por múltiplos status
- Deve retornar ordens ordenadas por pickedAt DESC
- Deve funcionar com paginação
- Deve retornar array vazio quando não há ordens
- Não deve retornar ordens de outros entregadores

## Notas

- O entregador só vê ordens que ele retirou (deliveryDriveId definido)
- Status disponíveis: `CREATED`, `WAITING`, `PICKED_UP`, `DELIVERED`, `RETURNED`
- A ordenação por `pickedAt` garante que as mais recentes vêm primeiro
