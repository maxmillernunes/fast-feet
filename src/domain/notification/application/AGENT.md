# NOTIFICATION APPLICATION

Use Cases, Subscribers e Repositories deste domínio.

**Dependências:**

- [Core Events](../core/events/AGENT.md) - Domain Events
- [Enterprise](./enterprise/AGENT.md) - Entity Notification

---

## COMO CRIAR USE CASE

Use Cases orquestram operações de negócio.

### Estrutura básica

```typescript
import { right, type Either } from '@/core/either'
import { [Entity] } from '../../enterprise/entities/[entity]'
import { [Repository] } from '../repositories/[repository]'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface [Action][Entity]Request {
  [field]: string
}

export type [Action][Entity]Response = Either<
  null,
  { [entity]: [Entity] }
>

export class [Action][Entity]UseCase {
  constructor(private [repository]: [Repository]) {}

  async execute({
    [field],
  }: [Action][Entity]Request): Promise<[Action][Entity]Response> {
    const [entity] = [Entity].create({
      [field]: // ...
    })

    await this.[repository].create([entity])

    return right({ [entity] })
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
import type { [Entity] } from '../entities/[entity]'

export abstract class [Repository] {
  abstract findById(id: string): Promise<[Entity] | null>
  abstract create([entity]: [Entity]): Promise<void>
  abstract save([entity]: [Entity]): Promise<void>
}
```

### Implementação In-Memory (para testes)

```typescript
import { [Repository] } from '../repositories/[repository]'
import { [Entity] } from '../entities/[entity]'

export class InMemory[Repository] implements [Repository] {
  public items: [Entity][] = []

  async findById(id: string): Promise<[Entity] | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async create([entity]: [Entity]): Promise<void> {
    this.items.push([entity])
  }

  async save([entity]: [Entity]): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals([entity].id))
    this.items[index] = [entity]
  }
}
```

---

## COMO CRIAR SUBSCRIBER

Subscribers são handlers de domain events que processam eventos de outros domínios.

### Estrutura

```typescript
import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { [Entity]Event } from '@/domain/[source]/enterprise/events/[entity]-event'
import { [Action][Entity]UseCase } from '../use-cases/[action]-[entity]'

export class On[Entity][Event] implements EventHandler {
  constructor(
    private [source]Repository: [Source]Repository,
    private [action][Entity]UseCase: [Action][Entity]UseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.[handler].bind(this),
      [Entity]Event.name,
    )
  }

  private async [handler]({ [entity] }: [Entity]Event) {
    const [source] = await this.[source]Repository.findById(
      [entity].[field].toString(),
    )

    if ([source]) {
      await this.[action][Entity]UseCase.execute({
        // ...
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

### Onde criar subscribers

```
application/
└── subscribers/
    ├── on-[entity]-created.ts
    ├── on-[entity]-updated.ts
    └── ...
```

### Referência

Para implementação real, veja: [Subscribers](./subscribers/)

---

## PADRÃO DE TESTE

### Use Case

```typescript
import { InMemory[Repository] } from '@test/repositories/in-memory-[repository]'
import { [Action][Entity]UseCase } from './[action]-[entity]'
import { make[Entity] } from '@test/factories/make-[entity]'

let [repository]: InMemory[Repository]
let sut: [Action][Entity]UseCase

describe('[Action] [Entity]', () => {
  beforeEach(() => {
    [repository] = new InMemory[Repository]()
    sut = new [Action][Entity]UseCase([repository])
  })

  it('should [action] [entity]', async () => {
    const result = await sut.execute({
      [field]: 'value',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect([repository].items).toHaveLength(1)
    }
  })
})
```

### Subscriber

```typescript
import { InMemory[Repository] } from '@test/repositories/in-memory-[repository]'
import { InMemory[Source]Repository } from '@test/repositories/in-memory-[source]-repository'
import { [Action][Entity]UseCase } from '../use-cases/[action]-[entity]'
import { On[Entity][Event] } from './on-[entity]-[event]'
import { make[Entity] } from '@test/factories/make-[entity]'
import { [Entity]Event } from '@/domain/[source]/enterprise/events/[entity]-event'

let [repository]: InMemory[Repository]
let [source]Repository: InMemory[Source]Repository
let [action][Entity]UseCase: [Action][Entity]UseCase
let sut: On[Entity][Event]

describe('On[Entity][Event]', () => {
  beforeEach(() => {
    [repository] = new InMemory[Repository]()
    [source]Repository = new InMemory[Source]Repository()
    [action][Entity]UseCase = new [Action][Entity]UseCase([repository])
    sut = new On[Entity][Event]([source]Repository, [action][Entity]UseCase)
  })

  it('should [action] when [event] occurs', async () => {
    const [entity] = make[Entity]()
    const event = new [Entity]Event([entity])

    await sut.[handler](event)

    expect([repository].items).toHaveLength(1)
  })
})
```

---

## BOAS PRÁTICAS

### 1. Handlers são methods privados

```typescript
// ✅ Correto
private async [handler](event: [Entity]Event) {
  // handler logic
}

// ❌ Incorreto
public async [handler](event: [Entity]Event) {
  // handler logic
}
```

### 2. Handler verifica condições antes de chamar use case

```typescript
// ✅ Correto
private async [handler]({ [entity] }: [Entity]Event) {
  const [source] = await this.[source]Repository.findById(
    [entity].[field].toString(),
  )

  if ([source]) {
    await this.[useCase].execute({ ... })
  }
}
```

### 3. use cases retornam Either<null, ...> quando não podem falhar

```typescript
// ✅ Correto
export type [Action]Response = Either<null, { [entity]: [Entity] }>

// ❌ Incorreto
export type [Action]Response = Either<Error, { [entity]: [Entity] }>
```

### 4. Subscribers são instanciados no bootstrap

```typescript
// Exemplo de instanciação no bootstrap
container.resolve(On[Entity]Created)
container.resolve(On[Entity]Updated)
```

### 5. Limpar handlers entre testes

```typescript
afterEach(() => {
  DomainEvents.clearHandlers()
  DomainEvents.clearMarkedAggregates()
})
```
