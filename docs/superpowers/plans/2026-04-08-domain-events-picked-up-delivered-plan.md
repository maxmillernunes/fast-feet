# Domain Events: OrderPickedUp e OrderDelivered Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar dois novos eventos de domínio (OrderPickedUpEvent e OrderDeliveredEvent) com subscribers correspondentes para notificar destinatários, incluindo correção do bug nos métodos pickUp() e deliver().

**Architecture:** Criar eventos de domínio na camada enterprise do módulo logistics, implementar subscribers no módulo de notificação que escutam esses eventos e enviam notificações ao destinatário. Corrigir a entidade Order para emitir eventos corretos.

**Tech Stack:** TypeScript, Domain Events pattern, Use Cases

---

## File Structure

### Arquivos a criar:

- `src/domain/logistics/enterprise/events/order-picked-up-event.ts`
- `src/domain/logistics/enterprise/events/order-delivered-event.ts`
- `src/domain/notification/application/subscribers/on-order-picked-up.ts`
- `src/domain/notification/application/subscribers/on-order-delivered.ts`
- `src/domain/notification/application/subscribers/on-order-picked-up.spec.ts`
- `src/domain/notification/application/subscribers/on-order-delivered.spec.ts`

### Arquivos a modificar:

- `src/domain/logistics/enterprise/entities/order.ts` (corrigir eventos emitidos em pickUp() e deliver())

---

## Task 1: Criar OrderPickedUpEvent

**Files:**

- Create: `src/domain/logistics/enterprise/events/order-picked-up-event.ts`
- Test: N/A (evento simples sem lógica)

- [ ] **Step 1: Criar arquivo de evento**

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

---

## Task 2: Criar OrderDeliveredEvent

**Files:**

- Create: `src/domain/logistics/enterprise/events/order-delivered-event.ts`
- Test: N/A (evento simples sem lógica)

- [ ] **Step 1: Criar arquivo de evento**

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

---

## Task 3: Corrigir Entidade Order - pickUp()

**Files:**

- Modify: `src/domain/logistics/enterprise/entities/order.ts:76-91`

- [ ] **Step 1: Corrigir import e evento emitido**

No arquivo `order.ts`, substituir:

```typescript
import { OrderMarkedAsAwaitingEvent } from '../events/order-marked-as-awaiting-events'
```

Por:

```typescript
import { OrderMarkedAsAwaitingEvent } from '../events/order-marked-as-awaiting-events'
import { OrderPickedUpEvent } from '../events/order-picked-up-event'
```

E no método pickUp(), substituir a linha que emitia o evento:

```typescript
this.addDomainEvent(new OrderMarkedAsAwaitingEvent(this))
```

Por:

```typescript
this.addDomainEvent(new OrderPickedUpEvent(this))
```

---

## Task 4: Corrigir Entidade Order - deliver()

**Files:**

- Modify: `src/domain/logistics/enterprise/entities/order.ts:93-114`

- [ ] **Step 1: Adicionar import e corrigir evento emitido**

Adicionar import:

```typescript
import { OrderDeliveredEvent } from '../events/order-delivered-event'
```

E no método deliver(), substituir:

```typescript
this.addDomainEvent(new OrderMarkedAsAwaitingEvent(this))
```

Por:

```typescript
this.addDomainEvent(new OrderDeliveredEvent(this))
```

---

## Task 5: Criar Subscriber OnOrderPickedUp

**Files:**

- Create: `src/domain/logistics/enterprise/events/order-picked-up-event.ts`
- Modify: `src/domain/notification/application/subscribers/on-order-picked-up.ts` (criar)
- Test: `src/domain/notification/application/subscribers/on-order-picked-up.spec.ts`

- [ ] **Step 1: Criar arquivo de subscriber**

```typescript
import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { OrderPickedUpEvent } from '@/domain/logistics/enterprise/events/order-picked-up-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderPickedUp implements EventHandler {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNotificationWhenOrderIsPickedUp.bind(this),
      OrderPickedUpEvent.name,
    )
  }

  private async sendNotificationWhenOrderIsPickedUp({
    order,
  }: OrderPickedUpEvent) {
    const recipient = await this.recipientsRepository.findById(
      order.recipientId.toString(),
    )

    if (recipient) {
      await this.sendNotificationUseCase.execute({
        recipientId: recipient.id.toString(),
        title: 'Encomenda retirada!',
        content: `Olá ${recipient.name}, sua encomenda foi retirada pelo entregador.`,
      })
    }
  }
}
```

- [ ] **Step 2: Criar teste**

Copiar estrutura de `on-order-created.spec.ts` e adaptar:

- Criar order com status WAITING
- Chamar pickUp() com deliveryDriverId
- Verificar que sendNotificationUseCase.execute foi chamado
- Verificar mensagem: "sua encomenda foi retirada pelo entregador"

---

## Task 6: Criar Subscriber OnOrderDelivered

**Files:**

- Create: `src/domain/notification/application/subscribers/on-order-delivered.ts`
- Test: `src/domain/notification/application/subscribers/on-order-delivered.spec.ts`

- [ ] **Step 1: Criar arquivo de subscriber**

```typescript
import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { OrderDeliveredEvent } from '@/domain/logistics/enterprise/events/order-delivered-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderDelivered implements EventHandler {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNotificationWhenOrderIsDelivered.bind(this),
      OrderDeliveredEvent.name,
    )
  }

  private async sendNotificationWhenOrderIsDelivered({
    order,
  }: OrderDeliveredEvent) {
    const recipient = await this.recipientsRepository.findById(
      order.recipientId.toString(),
    )

    if (recipient) {
      await this.sendNotificationUseCase.execute({
        recipientId: recipient.id.toString(),
        title: 'Encomenda entregue!',
        content: `Olá ${recipient.name}, sua encomenda foi entregue com sucesso!`,
      })
    }
  }
}
```

- [ ] **Step 2: Criar teste**

Copiar estrutura de `on-order-created.spec.ts` e adaptar:

- Criar order com status PICKED_UP
- Chamar deliver() com deliveryDriverId
- Verificar que sendNotificationUseCase.execute foi chamado
- Verificar mensagem: "sua encomenda foi entregue com sucesso!"

---

## Task 7: Verificar Integração

**Files:**

- Verificar que subscribers estão sendo instanciados na aplicação

- [ ] **Step 1: Verificar módulos**

Verificar se há um arquivo de módulo de notificação (como `notification-module.ts` ou similar) que instancia os subscribers. Se existir, adicionar os novos subscribers lá.

- [ ] **Step 2: Rodar testes**

```bash
npm test -- --run src/domain/notification/application/subscribers/
```

Esperado: Todos os testes passando

---

## Self-Review Checklist

- [ ] Spec coverage: Todos os requisitos do spec têm tasks correspondentes
- [ ] Nenhum placeholder (TBD, TODO, etc)
- [ ] Consistência de tipos: nomes de métodos e propriedades corretos
- [ ] Correção do bug incluída (pickUp e deliver emitem eventos corretos)
