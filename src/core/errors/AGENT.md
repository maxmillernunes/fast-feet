# CORE ERRORS

Erros compartilhados em todo o sistema.

## CONTRATO

Todo erro implementa `UseCaseError`:

```typescript
interface UseCaseError {
  message: string
}
```

## ERROS PRONTOS

Use quando o erro se encaixa em uma dessas categorias:

| Erro                         | Quando usar            | Exemplo                |
| ---------------------------- | ---------------------- | ---------------------- |
| `ResourceNotFoundError`      | Recurso não encontrado | "Recipient not found"  |
| `NotAllowedError`            | Operação não permitida | "Admin required"       |
| `ResourceAlreadyExistsError` | Recurso duplicado      | "Email already exists" |

### Como usar

```typescript
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

// Erro genérico
return left(new ResourceNotFoundError())
// Mensagem: "Resource not found."

// Erro com contexto
return left(new ResourceNotFoundError('Recipient'))
// Mensagem: "Recipient not found."
```

---

## CRIANDO ERROS DE DOMÍNIO

Quando precisa de um erro específico do negócio (ex: transição de status inválida).

### Passo a passo

1. **Crie o arquivo** em `entities/errors/`

```typescript
// src/domain/logistics/enterprise/entities/errors/order-can-not-transition-error.ts

// ❌ Não precisa de import do core
// ❌ Não implemente UseCaseError explicitamente
// ✅ Basta extender Error diretamente

export class OrderCanNotTransitionError extends Error {
  constructor() {
    super('Order must be in WAITING status to be picked up.')
  }
}
```

### Padrão da mensagem

Siga o formato: `"Entidade deve estar em STATUS para AÇÃO."`

```
"Order must be in WAITING status to be picked up."
"Order must be in PICKED_UP status to be delivered."
"Order must be in CREATED status to be marked as waiting."
```

### Como usar no código

```typescript
import { OrderCanNotTransitionError } from './errors/order-can-not-transition-error'

public pickUp(driverId: UniqueEntityId): Either<OrderCanNotTransitionError, null> {
  if (!this.canTransitionTo('PICKED_UP')) {
    return left(new OrderCanNotTransitionError())
  }

  // lógica de transição...

  return right(null)
}
```

---

## FLUXO DE ERROS

```
UseCase captura erro
      ↓
Entity retorna Either<Erro, Sucesso>
      ↓
UseCase checa isLeft()
      ↓
Se Left → retorna left(erro)
Se Right → continua execução
```

### Exemplo completo

```typescript
// No Entity
public deliver(driverId: UniqueEntityId): Either<DeliveryError, null> {
  if (!this.isDriverAssigned(driverId)) {
    return left(new DeliveryDriverDoesNotMatchError())
  }

  if (!this.canTransitionTo('DELIVERED')) {
    return left(new OrderCanNotTransitionToDeliveryError())
  }

  // sucesso
  return right(null)
}

// No UseCase
async execute(request): Promise<Response> {
  const order = await this.ordersRepository.findById(id)

  if (!order) {
    return left(new ResourceNotFoundError())
  }

  const result = order.deliver(request.driverId)

  if (result.isLeft()) {
    return left(result.value)
  }

  await this.ordersRepository.save(order)
  return right({ order })
}
```
