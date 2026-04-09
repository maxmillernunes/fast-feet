# Domain Events: OrderPickedUp e OrderDelivered

**Data:** 2026-04-08  
**Status:** Aprovado

---

## Objetivo

Implementar dois novos eventos de domínio para notificar o destinatário quando:

1. Uma encomenda for retirada para entrega por um entregador
2. Uma encomenda for entregue pelo entregador

---

## Contexto

O sistema já possui eventos de domínio para `OrderCreated` e `OrderMarkedAsAwaiting`, com subscribers correspondentes no módulo de notificação.

**Problema identificado:** Os métodos `pickUp()` e `deliver()` na entidade `Order` estão emitindo `OrderMarkedAsAwaitingEvent` incorretamente.

---

## Design

### 1. Domain Events

**Arquivo:** `src/domain/logistics/enterprise/events/order-picked-up-event.ts`

```typescript
import type { DomainEvent } from '@/core/events/domain-event'
import type { Order } from '../entities/order'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class OrderPickedUpEvent implements DomainEvent {
  public occurredAt: Date
  public order: Order

  constructor(order: Order) {
    this.order = order
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.order.id
  }
}
```

**Arquivo:** `src/domain/logistics/enterprise/events/order-delivered-event.ts`

```typescript
import type { DomainEvent } from '@/core/events/domain-event'
import type { Order } from '../entities/order'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class OrderDeliveredEvent implements DomainEvent {
  public occurredAt: Date
  public order: Order

  constructor(order: Order) {
    this.order = order
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.order.id
  }
}
```

### 2. Subscribers

**Arquivo:** `src/domain/notification/application/subscribers/on-order-picked-up.ts`

- Mensagem: "Olá {recipient.name}, sua encomenda foi retirada pelo entregador."
- Segue padrão existente de `OnOrderCreated` e `OnOrderMarkedAsAwaiting`

**Arquivo:** `src/domain/notification/application/subscribers/on-order-delivered.ts`

- Mensagem: "Olá {recipient.name}, sua encomenda foi entregue com sucesso!"
- Segue padrão existente

### 3. Correção na Entidade Order

**Arquivo:** `src/domain/logistics/enterprise/entities/order.ts`

| Método                  | Antes                        | Depois                |
| ----------------------- | ---------------------------- | --------------------- |
| `pickUp()` (linha 88)   | `OrderMarkedAsAwaitingEvent` | `OrderPickedUpEvent`  |
| `deliver()` (linha 111) | `OrderMarkedAsAwaitingEvent` | `OrderDeliveredEvent` |

### 4. Testes

- `on-order-picked-up.spec.ts`
- `on-order-delivered.spec.ts`

---

## Arquitetura Final

```
src/domain/logistics/enterprise/events/
├── order-created-event.ts
├── order-marked-as-awaiting-events.ts
├── order-picked-up-event.ts        ← NOVO
└── order-delivered-event.ts       ← NOVO

src/domain/notification/application/subscribers/
├── on-order-created.ts
├── on-order-marked-as-awaiting.ts
├── on-order-picked-up.ts           ← NOVO
└── on-order-delivered.ts          ← NOVO
```

---

## Critérios de Aceitação

1. Ao chamar `pickUp()` na entidade Order, `OrderPickedUpEvent` é emitido
2. Ao chamar `deliver()` na entidade Order, `OrderDeliveredEvent` é emitido
3. Subscriber `OnOrderPickedUp` envia notificação ao destinatário com mensagem correta
4. Subscriber `OnOrderDelivered` envia notificação ao destinatário com mensagem correta
5. Testes unitários passando para todos os novos arquivos
