# IAM APPLICATION

Use Cases e Repositories deste domínio.

---

## COMO CRIAR USE CASE

Use Cases orquestram operações de negócio.

### Estrutura básica

```typescript
import { left, right, type Either } from '@/core/either'
import { [Repository] } from '../repositories/[repository]'
import { HashComparer } from '../cryptography/hash-comparer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { [Entity] } from '../../enterprise/entities/[entity]'

interface [Action][Entity]Request {
  [field]: string
  [credential]: string
}

type [Action][Entity]Response = Either<
  ResourceNotFoundError | InvalidCredentialsError | Invalid[VO]Error,
  { [entity]: [Entity] }
>

export class [Action][Entity]UseCase {
  constructor(
    private [repository]: [Repository],
    private hashComparer: HashComparer,
  ) {}

  async execute({
    [field],
    [credential],
  }: [Action][Entity]Request): Promise<[Action][Entity]Response> {
    const [entity] = await this.[repository].findBy[Field]([field])

    if (![entity]) {
      return left(new ResourceNotFoundError())
    }

    const isValid = await this.hashComparer.compare(
      [credential],
      [entity].[credentialField],
    )

    if (!isValid) {
      return left(new InvalidCredentialsError())
    }

    return right({ [entity] })
  }
}
```

### Padrões

| Parte           | O que fazer                       |
| --------------- | --------------------------------- |
| **Imports**     | Sempre no topo, paths absolutos   |
| **Request**     | Interface com os dados de entrada |
| **Response**    | `Either<Erro, Sucesso>`           |
| **Constructor** | Recebe repositório via DI         |
| **execute()**   | Método principal, sempre `async`  |

---

## PADRÃO: USE CASE DE CRIAÇÃO

Para criar novas entidades:

```typescript
interface Create[Entity]Request {
  [field]: string
  [anotherField]: string
  [credential]: string
}

type Create[Entity]Response = Either<
  Invalid[VO]Error | Invalid[Credential]Error | [Entity]AlreadyExistsError,
  { [entity]: [Entity] }
>

export class Create[Entity]UseCase {
  constructor(
    private [repository]: [Repository],
    private hashGenerator: HashGenerator,
  ) {}

  async execute(request: Create[Entity]Request): Promise<Create[Entity]Response> {
    const [documentVO] = [Document].create(request.[field])
    if ([documentVO].isLeft()) {
      return left([documentVO].value)
    }

    const [credentialVO] = [Credential].create(request.[credential])
    if ([credentialVO].isLeft()) {
      return left([credentialVO].value)
    }

    const existing = await this.[repository].findBy[Field](request.[field])
    if (existing) {
      return left(new [Entity]AlreadyExistsError(request.[field]))
    }

    const hash = await this.hashGenerator.generate(request.[credential])

    const [entity] = [Entity].create({
      [field]: request.[field],
      [anotherField]: request.[anotherField],
      [credentialField]: hash,
    })

    await this.[repository].create([entity])

    return right({ [entity] })
  }
}
```

---

## PADRÃO: USE CASE DE LEITURA

Para listagens, retorne sucesso mesmo vazio:

```typescript
type Response = Either<null, { [entities]: [Entity][] }>

async execute({ page = 1, perPage = 10 }): Promise<Response> {
  const [entities] = await this.[repository].findMany({ page, perPage })
  return right({ [entities] })
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
  ResourceNotFoundError | Invalid[VO]Error,
  { [entity]: [Entity] }
>

async execute({ [param] }): Promise<Response> {
  const [entity] = await this.[repository].findById([param])
  if (![entity]) {
    return left(new ResourceNotFoundError())
  }

  const result = [entity].[action]()
  if (result.isLeft()) {
    return left(result.value)
  }

  await this.[repository].save([entity])
  return right({ [entity] })
}
```

---

## COMO CRIAR REPOSITORY

### Interface

```typescript
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { [Entity] } from '../../enterprise/entities/[entity]'

export abstract class [Repository] {
  abstract findById(id: string): Promise<[Entity] | null>

  abstract findBy[Field]([field]: string): Promise<[Entity] | null>

  abstract findMany(params: PaginationParams): Promise<[Entity][]>

  abstract count(): Promise<number>

  abstract create([entity]: [Entity]): Promise<void>

  abstract save([entity]: [Entity]): Promise<void>

  abstract delete([entity]: [Entity]): Promise<void>
}
```

### Implementação In-Memory (para testes)

```typescript
export class InMemory[Repository] implements [Repository] {
  public items: [Entity][] = []

  async findById(id: string): Promise<[Entity] | null> {
    return this.items.find(([entity]) => [entity].id.toString() === id) ?? null
  }

  async findBy[Field]([field]: string): Promise<[Entity] | null> {
    return this.items.find(([entity]) => [entity].[field] === [field]) ?? null
  }

  async findMany({ page, perPage }: PaginationParams): Promise<[Entity][]> {
    const start = (page - 1) * perPage
    const end = page * perPage

    return this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, end)
  }

  async count(): Promise<number> {
    return this.items.length
  }

  async save([entity]: [Entity]): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals([entity].id))
    this.items[index] = [entity]
  }

  async create([entity]: [Entity]): Promise<void> {
    this.items.push([entity])
  }

  async delete([entity]: [Entity]): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals([entity].id))
    this.items[index].props.deletedAt = new Date()
  }
}
```

### Regras

1. **Interface primeiro** → define o contrato
2. **Implementação separada** → para testes, use in-memory
3. **Métodos sempre `async`** → mesmo no in-memory
4. **Retornar `null`** → quando não encontrar

---

## CRYPTOGRAPHY

### Interface: HashGenerator

```typescript
export abstract class HashGenerator {
  abstract generate(plain: string): Promise<string>
}
```

### Interface: HashComparer

```typescript
export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
}
```

---

## ESTRUTURA DE TESTES

Todo use case tem seu teste na **mesma pasta**:

```
application/
├── use-cases/
│   ├── [action]-[entity].ts
│   └── [action]-[entity].spec.ts
├── repositories/
│   └── in-memory-[entity]-repository.ts
└── cryptography/
    └── in-memory-hash-comparer.ts
```

### Padrão de teste

```typescript
import { InMemory[Repository] } from '@test/repositories/in-memory-[repository]'
import { make[Entity] } from '@test/factories/make-[entity]'
import { [Action][Entity]UseCase } from './[action]-[entity]'
import { InMemoryHashComparer } from '../cryptography/in-memory-hash-comparer'

let [repository]: InMemory[Repository]
let hashComparer: InMemoryHashComparer
let sut: [Action][Entity]UseCase

describe('[Action] [Entity]', () => {
  beforeEach(() => {
    [repository] = new InMemory[Repository]()
    hashComparer = new InMemoryHashComparer()
    sut = new [Action][Entity]UseCase([repository], hashComparer)
  })

  it('should [action] [entity]', async () => {
    const [entity] = make[Entity]()
    await [repository].create([entity])

    const result = await sut.execute({ [param]: [entity].[field] })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.[entity].[field]).toBe('[expected]')
    }
  })

  it('should fail when [entity] not found', async () => {
    const result = await sut.execute({ [param]: 'invalid' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
```

### Ordem do teste: AAA

1. **Arrange** → setup, criar dados
2. **Act** → executar a ação
3. **Assert** → verificar resultado
