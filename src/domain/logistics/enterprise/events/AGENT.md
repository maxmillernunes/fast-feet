# EVENTS

Events de domínio específicos do domínio de logística.

---

## COMO CRIAR DOMAIN EVENT

Domain Events são entidades que representam algo que aconteceu no passado e que outros domínios podem querer ouvir.

### Estrutura Básica

```typescript
import type { DomainEvent } from '@/core/events/domain-event'
import type { [Entity] } from '../entities/[entity]'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class [Entity]CreatedEvent implements DomainEvent {
  public occurredAt: Date
  public [entity]: [Entity]

  constructor([entity]: [Entity]) {
    this.[entity] = [entity]
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.[entity].id
  }
}
```

### Regras

- Implementa `DomainEvent` interface
- `occurredAt`: momento em que o evento ocorreu (não de dispatch)
- `getAggregateId()`: ID da entidade que gerou o evento
- Não guarda nada sensível (senhas, tokens, etc)

### Onde criar events

```
enterprise/
└── events/
    ├── order-created-event.ts
    ├── order-marked-as-awaiting-event.ts
    └── ...
```

---

## COMO CRIAR EVENT HANDLER

Event Handlers são classes que ouvem eventos e disparam ações reativas, normalmente sendo implementados dentro do sub-domains que iram ouvir o evento.

### Estrutura

```typescript
import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { [Entity]CreatedEvent } from './[entity]-created-event'

export class On[Entity]Created implements EventHandler {
  constructor(
    private [useCase]: [UseCase],
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.on[Entity]Created.bind(this),
      [Entity]CreatedEvent.name,
    )
  }

  private async on[Entity]Created({ [entity] }: [Entity]CreatedEvent) {
    // handler logic
  }
}
```

### Padrão de handler

1. **Constructor**
   - Recebe use cases via DI
   - Chama `setupSubscriptions()`

2. **setupSubscriptions()**
   - Inscreve handler no `DomainEvents`
   - Usa `Event.name` como string key

3. **handler method**
   - `private async on[Entity]Created(event: [Entity]CreatedEvent)`
   - Processa evento e chama use case

### Onde criar subscribers

```
application/
└── subscribers/
    ├── on-[entity]-created.ts
    ├── on-[entity]-updated.ts
    └── ...
```

---

## IMPLEMENTAÇÃO BASE

### DomainEvent

Interface que todos os eventos devem implementar.

```typescript
export interface DomainEvent {
  occurredAt: Date
  getAggregateId(): UniqueEntityId
}
```

### DomainEvents

Classe gerenciadora de eventos e handlers.

#### Métodos principais

- `register(callback, eventClassName)`: Inscreve handler para um evento
- `dispatchAggregateEvents(aggregate)`: Dispara todos os eventos de uma aggregate
- `dispatchEventsForAggregate(id)`: Dispara eventos de uma aggregate específica
- `clearHandlers()`: Limpa todos os handlers (para testes)
- `clearMarkedAggregates()`: Limpa aggregates marcadas para dispatch

#### Padrão de uso

```typescript
// Registrar handler
DomainEvents.register(
  this.on[Entity]Created.bind(this),
  [Entity]CreatedEvent.name,
)

// Marcar aggregate para dispatch (no AggregateRoot)
protected addDomainEvent(domainEvent: DomainEvent): void {
  this._domainEvents.push(domainEvent)
  DomainEvents.markAggregateForDispatch(this)
}

// Limpar eventos após dispatch (no AggregateRoot)
public clearEvents() {
  this._domainEvents = []
}
```

---

## SUBSCRIBERS

Os subscribers (handlers) são implementados no domínio que ouve os eventos.

Veja implementação em: [notification/application/AGENT.md](../../../notification/application/AGENT.md)

---

## BOAS PRÁTICAS

### 1. Events guardam só o necessário

```typescript
// ✅ Correto
export class [Entity]CreatedEvent implements DomainEvent {
  public occurredAt: Date
  public [entity]: [Entity]
}

// ❌ Incorreto
export class [Entity]CreatedEvent implements DomainEvent {
  public occurredAt: Date
  public [entity]: [Entity]
  public [related]: [RelatedEntity] // dados duplicados
}
```

### 2. Handlers são métodos privados

```typescript
// ✅ Correto
private async on[Entity]Created(event: [Entity]CreatedEvent) {
  // handler logic
}

// ❌ Incorreto
public async on[Entity]Created(event: [Entity]CreatedEvent) {
  // handler logic
}
```

### 3. Handler verifica condições antes de chamar use case

```typescript
// ✅ Correto
private async on[Entity]Created({ [entity] }: [Entity]CreatedEvent) {
  const [source] = await this.[source]Repository.findById(
    [entity].[sourceField].toString(),
  )

  if ([source]) {
    await this.[useCase].execute({ ... })
  }
}

// ❌ Incorreto
private async on[Entity]Created({ [entity] }: [Entity]CreatedEvent) {
  await this.[useCase].execute({ ... })
  // use case vai falhar se [source] não existe
}
```

### 4. Limpar handlers entre testes

```typescript
afterEach(() => {
  DomainEvents.clearHandlers()
  DomainEvents.clearMarkedAggregates()
})
```
