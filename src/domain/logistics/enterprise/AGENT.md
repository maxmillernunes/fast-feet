# LOGISTICS ENTERPRISE

Entities, Value Objects e erros específicos do domínio de logística.

---

## COMO CRIAR ENTITY

### Props

Props são os dados que a entidade carrega.

```typescript
export interface [Nome]Props {
  [field]: [Type]
  [anotherField]?: [Type]
  status: [StatusVO]
  createdAt: Date
  updatedAt?: Date
  [timestamp]?: Date
}
```

### Classe

```typescript
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { [StatusVO] } from './values-objects/[status-vo]'
import { left, right, type Either } from '@/core/either'
import { [Nome]TransitionError } from './errors/[nome]-transition-error'

export class [Nome] extends Entity<[Nome]Props> {
  get [field]() {
    return this.props.[field]
  }

  get status() {
    return this.props.status
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  public [action](): Either<[Nome]TransitionError, null> {
    if (!this.props.status.canTransitionTo('[TARGET_STATUS]')) {
      return left(new [Nome]TransitionError())
    }

    this.props.status = [StatusVO].create('[TARGET_STATUS]')
    this.touch()

    return right(null)
  }

  static create(
    props: Optional<[Nome]Props, 'status' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    const [entity] = new [Nome](
      {
        ...props,
        status: props.status ?? [StatusVO].create(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return [entity]
  }
}
```

### Regras

- Props são protegidos → use getters
- Use `private touch()` → atualiza `updatedAt`
- Métodos retornam Either → sucesso ou erro
- Use `static create()` → para criar instâncias

---

## COMO CRIAR VALUE OBJECT

Value Objects são imutáveis e comparados por valor.

### Estrutura

```typescript
import { ValueObject } from '@/core/entities/value-object'

interface [Nome]Props {
  value: string
}

export class [Nome] extends ValueObject<[Nome]Props> {
  private constructor(props: [Nome]Props) {
    super(props)
  }

  static create(status?: string): [Nome] {
    return new [Nome]({ value: status ?? '[DEFAULT]' })
  }

  canTransitionTo(target: string): boolean {
    const transitions: Record<string, string[]> = {
      [STATUS_A]: [[STATUS_B]],
      [STATUS_B]: [[STATUS_C]],
      [STATUS_C]: [],
    }
    return transitions[this.value]?.includes(target) ?? false
  }

  get value() {
    return this.props.value
  }
}
```

### Regras

- Imutável → sem setters, métodos retornam novos objetos
- Construtor privado → só cria via `static create()`
- Comparado por valor → `equals()` usa comparação de props

---

## COMO CRIAR ERROS DE DOMÍNIO

### Estrutura

```typescript
// Em: enterprise/entities/errors/[nome]-transition-error.ts

export class [Nome]TransitionError extends Error {
  constructor() {
    super('[Entity] must be in [CURRENT_STATUS] to [action].')
  }
}
```

### Onde criar erros

```
enterprise/
├── entities/
│   └── [entity].ts
└── errors/
    ├── [entity]-transition-error.ts
    └── [domain]-error.ts
```

### Padrão da mensagem

Formato: `"Entidade deve estar em STATUS para AÇÃO."`

| Status atual | Status desejado | Mensagem                                      |
| ------------ | --------------- | --------------------------------------------- |
| [STATUS_A]   | [STATUS_B]      | "[Entity] must be in [STATUS_A] to [action]." |
| [STATUS_B]   | [STATUS_C]      | "[Entity] must be in [STATUS_B] to [action]." |

---

## TIPO EITHER NOS MÉTODOS

Quando um método pode falhar, retorne Either:

```typescript
type [Action]Result = Either<
  [Entity]TransitionError | [Mismatch]Error,
  null
>

public [action]([param]: UniqueEntityId): [Action]Result {
  if (!this.canTransitionTo('[TARGET_STATUS]')) {
    return left(new [Entity]TransitionError())
  }

  if (!this.isAssignedTo([param])) {
    return left(new [Mismatch]Error())
  }

  this.props.status = [StatusVO].create('[TARGET_STATUS]')
  return right(null)
}
```

### Benefícios

1. **Explícito** → quem usa sabe que pode falhar
2. **Type-safe** → TypeScript ajuda a tratar erros
3. **Composto** → pode encadear validações
