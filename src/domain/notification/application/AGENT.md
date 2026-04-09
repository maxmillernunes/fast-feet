# NOTIFICATION APPLICATION

Use Cases, Subscribers e Repositories deste domínio.

---

## COMO CRIAR USE CASE

Use Cases orquestram operações de negócio.

### Estrutura básica

```typescript
import { right, type Either } from '@/core/either'
import { Notification } from '../../enterprise/entities/notification'
import { NotificationsRepository } from '../repositories/notifications-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface SendNotificationRequest {
  recipientId: string
  title: string
  content: string
}

export type SendNotificationResponse = Either<
  null,
  { notification: Notification }
>

export class SendNotificationUseCase {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async execute({
    content,
    recipientId,
    title,
  }: SendNotificationRequest): Promise<SendNotificationResponse> {
    const notification = Notification.create({
      recipientId: new UniqueEntityId(recipientId),
      title,
      content,
    })

    await this.notificationsRepository.create(notification)

    return right({ notification })
  }
}
```

### Padrões

| Parte           | O que fazer                                |
| --------------- | ------------------------------------------ |
| **Request**     | Interface com dados de entrada             |
| **Response**    | Either<null, Sucesso> (se não pode falhar) |
| **Constructor** | Recebe repository via DI                   |
| **execute()**   | Método principal, sempre async             |

---

## COMO CRIAR REPOSITORY

### Interface

```typescript
import type { Notification } from '../entities/notification'

export abstract class NotificationsRepository {
  abstract findById(id: string): Promise<Notification | null>
  abstract create(notification: Notification): Promise<void>
  abstract save(notification: Notification): Promise<void>
}
```

### Implementação In-Memory (para testes)

```typescript
import { NotificationsRepository } from '../repositories/notifications-repository'
import { Notification } from '../entities/notification'

export class InMemoryNotificationsRepository implements NotificationsRepository {
  public items: Notification[] = []

  async findById(id: string): Promise<Notification | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async create(notification: Notification): Promise<void> {
    this.items.push(notification)
  }

  async save(notification: Notification): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(notification.id),
    )
    this.items[index] = notification
  }
}
```

---

## COMO CRIAR FACTORY

```typescript
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { faker } from '@faker-js/faker'

export interface MakeNotificationProps {
  recipientId?: UniqueEntityId
  title?: string
  content?: string
}

export function makeNotification(
  props: Optional<MakeNotificationProps, 'recipientId'> = {},
  id?: UniqueEntityId,
) {
  const notification = Notification.create(
    {
      recipientId: props.recipientId ?? new UniqueEntityId(faker.string.uuid()),
      title: props.title ?? faker.lorem.sentence(),
      content: props.content ?? faker.lorem.paragraph(),
      createdAt: new Date(),
    },
    id,
  )

  return notification
}
```

---

## COMO CRIAR SUBSCRIBER

Subscribers são handlers de domain events que processam eventos de outros domínios.

### Estrutura

```typescript
import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { [Entity]CreatedEvent } from '@/domain/[source-domain]/enterprise/events/[entity]-created-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class On[Entity]Created implements EventHandler {
  constructor(
    private [source]Repository: [Source]Repository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.[handlerMethod].bind(this),
      [Entity]CreatedEvent.name,
    )
  }

  private async [handlerMethod]({ [entity] }: [Entity]CreatedEvent) {
    const [source] = await this.[source]Repository.findById(
      [entity].[sourceField].toString(),
    )

    if ([source]) {
      await this.sendNotificationUseCase.execute({
        recipientId: [source].id.toString(),
        title: '[Title]',
        content: `[Content]`,
      })
    }
  }
}
```

### Padrão de subscriber

1. **Constructor**
   - Recebe repository e use cases via DI
   - Chama `setupSubscriptions()` no final

2. **setupSubscriptions()**
   - Inscreve handler no `DomainEvents`
   - Usa `Event.name` como string key

3. **handler method**
   - `private async` com nome descritivo
   - Recebe o evento como parâmetro
   - Verifica condições antes de chamar use case
   - Chama use case para processar ação

### Onde criar subscribers

```
application/
└── subscribers/
    ├── on-[entity]-created.ts
    ├── on-[entity]-updated.ts
    └── ...
```

### Referência

Para exemplo completo, veja: [Subscribers Implementados](./subscribers/)

---

## BOAS PRÁTICAS

### 1. Handlers são methods privados

```typescript
// ✅ Correto
private async [handlerMethod](event: [Entity]CreatedEvent) {
  // handler logic
}

// ❌ Incorreto
public async [handlerMethod](event: [Entity]CreatedEvent) {
  // handler logic
}
```

### 2. Handler verifica condições antes de chamar use case

```typescript
// ✅ Correto
private async [handlerMethod]({ [entity] }: [Entity]CreatedEvent) {
  const [source] = await this.[source]Repository.findById(
    [entity].[sourceField].toString(),
  )

  if ([source]) {
    await this.sendNotificationUseCase.execute({ ... })
  }
}

// ❌ Incorreto
private async [handlerMethod]({ [entity] }: [Entity]CreatedEvent) {
  await this.sendNotificationUseCase.execute({ ... })
  // use case vai falhar se [source] não existe
}
```

### 3. use cases retornam Either<null, ...> quando não podem falhar

```typescript
// ✅ Correto
export type [Action]Response = Either<null, { notification: Notification }>

// ❌ Incorreto
export type [Action]Response = Either<Error, { notification: Notification }>
```

### 4. Domain Events guardam só o necessário

```typescript
// ✅ Correto
export class [Entity]CreatedEvent implements DomainEvent {
  public occurredAt: Date
  public [entity]: [Entity]
  // só o necessário para a lógica de notification
}

// ❌ Incorreto
export class [Entity]CreatedEvent implements DomainEvent {
  public occurredAt: Date
  public [entity]: [Entity]
  public [related]: [RelatedEntity] // dados duplicados
}
```

### 5. Subscribers são instanciados no bootstrap

```typescript
// Exemplo de instanciação no bootstrap
container.resolve(On[Entity]Created)
container.resolve(On[Entity]Updated)
```
