# EVENTS

Infraestrutura base para Domain Events.

## O QUE É

Implementação do padrão de Domain Events para comunicação entre domínios sem acoplamento.

- `DomainEvent`: Interface base para todos os eventos
- `DomainEvents`: Gerenciador central de eventos e handlers
- `EventHandler`: Interface para handlers de eventos
- `AggregateRoot`: Classe base que mantém lista de eventos internos

## EVENTOS DE DOMÍNIO

### DomainEvent

Interface que todos os eventos de domínio devem implementar.

```typescript
export interface DomainEvent {
  occurredAt: Date
  getAggregateId(): UniqueEntityId
}
```

### DomainEvents

Classe que gerencia registration e dispatch de eventos.

#### Métodos

| Método                                | Descrição                        |
| ------------------------------------- | -------------------------------- |
| `register(callback, eventClassName)`  | Inscreve handler para um evento  |
| `markAggregateForDispatch(aggregate)` | Marca aggregate para dispatch    |
| `dispatchEventsForAggregate(id)`      | Dispara eventos de uma aggregate |
| `clearHandlers()`                     | Limpa todos os handlers          |
| `clearMarkedAggregates()`             | Limpa aggregates marcadas        |

### AggregateRoot

Classe base que extende `Entity` e mantém lista de eventos internos.

#### Métodos

- `domainEvents`: Getter para lista de eventos acumulados
- `addDomainEvent(event)`: Adiciona evento e marca aggregate
- `clearEvents()`: Limpa eventos após dispatch

### EventHandler

Interface para handlers de eventos.

```typescript
export interface EventHandler {
  setupSubscriptions(): void
}
```

## Padrão de Uso

### Criar Evento

```typescript
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

### Usar no AggregateRoot

```typescript
export class [Entity] extends AggregateRoot<[Entity]Props> {
  public [action](): Either<[Error], null> {
    if (!this.canTransitionTo('[TARGET_STATUS]')) {
      return left(new [Error]())
    }

    this.props.status = [Status].create('[TARGET_STATUS]')
    this.addDomainEvent(new [Entity]CreatedEvent(this))

    return right(null)
  }
}
```

### Criar Handler

```typescript
export class On[Entity]Created implements EventHandler {
  constructor(private [service]: [Service]) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.[handlerMethod].bind(this),
      [Entity]CreatedEvent.name,
    )
  }

  private async [handlerMethod]({ [entity] }: [Entity]CreatedEvent) {
    await this.[service].send({
      // handler logic
    })
  }
}
```

## DISPATCH AUTOMÁTICO

Após cada use case, chamar: normalmente sendo feito apos incerto no banco de dados, pois assim temos a certeza que podemos disparar.

```typescript
DomainEvents.dispatchEventsForAggregate(order.id)
```

Ou configurar interceptors/middlewares para fazer isso automaticamente.

## LIMPEZA ENTRE TESTES

```typescript
afterEach(() => {
  DomainEvents.clearHandlers()
  DomainEvents.clearMarkedAggregates()
})
```
