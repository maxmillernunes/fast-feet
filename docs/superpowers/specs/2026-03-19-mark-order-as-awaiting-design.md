# Design: Marcar Encomenda como Awaiting

**Data:** 2026-03-19  
**Status:** Aprovado

## Objetivo

Permitir que o admin marque uma encomenda como "aguardando retirada" (Awaiting), transicionando o status de `CREATED` para `WAITING`.

## Decisões de Design

- **Complexidade:** Funcionalidade simples — um use case e um método no entity
- **Permissão:** Apenas admin pode executar (consistente com `RegisterOrderUseCase`)
- **Padrão:** Segue estrutura existente de `PickUpOrderUseCase` e métodos `pickUp()`, `deliver()`, `return()`

## Estrutura de Arquivos

### Novos Arquivos

```
src/domain/logistics/enterprise/entities/errors/
├── order-can-not-transition-to-waiting-error.ts  (novo)

src/domain/logistics/application/use-cases/
├── mark-order-as-awaiting.ts  (novo)
```

### Arquivos Modificados

```
src/domain/logistics/enterprise/entities/order.ts
```

## Implementação

### 1. Error (`order-can-not-transition-to-waiting-error.ts`)

```typescript
export class OrderCanNotTransitionToWaitingError extends Error {
  constructor() {
    super('Order must be in CREATED status to be marked as waiting.')
  }
}
```

### 2. Entity (`order.ts`)

Adicionar tipo `AwaitingOrder` e método `markAsAwaiting()`:

```typescript
type AwaitingOrder = Either<OrderCanNotTransitionToWaitingError, null>

public markAsAwaiting(): AwaitingOrder {
  if (!this.props.status.canTransitionTo('WAITING')) {
    return left(new OrderCanNotTransitionToWaitingError())
  }

  this.props.status = OrderStatus.create('WAITING')
  this.touch()

  return right(null)
}
```

### 3. Use Case (`mark-order-as-awaiting.ts`)

```typescript
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

### 4. Testes

- `mark-order-as-awaiting.spec.ts` — testes unitários cobrindo:
  - Sucesso: transição de `CREATED` para `WAITING`
  - Erro: transição inválida de `WAITING` para `WAITING`
  - Erro: transição inválida de `PICKED_UP` para `WAITING`
  - Erro: transição inválida de `DELIVERED` para `WAITING`
  - Erro: encomenda não encontrada

## Fluxo de Status

```
CREATED → WAITING → PICKED_UP → DELIVERED
                        ↓
                    RETURNED → WAITING
```

## Notas

- O `adminId` é mantido na interface por consistência, mas não é validado no use case (mantendo padrão existente)
- A transição `CREATED → WAITING` já está definida em `transitions` em `OrderStatus`
