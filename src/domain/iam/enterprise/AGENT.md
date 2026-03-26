# IAM ENTERPRISE

Entities, Value Objects e erros específicos do domínio de IAM.

---

## COMO CRIAR ENTITY

### Props

Props são os dados que a entidade carrega.

```typescript
export interface [Nome]Props {
  [field]: [Type]
  [anotherField]?: [Type]
  role: [RoleVO]
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}
```

### Classe

```typescript
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { [RoleVO] } from './values-objects/[role-vo]'
import { left, right, type Either } from '@/core/either'
import { [Nome]AlreadyExistsError } from './errors/[nome]-already-exists-error'

export class [Nome] extends Entity<[Nome]Props> {
  get [field]() {
    return this.props.[field]
  }

  get role() {
    return this.props.role
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get isDeleted() {
    return !!this.props.deletedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  public [action](): Either<[Nome]AlreadyExistsError, null> {
    if (this.isDeleted) {
      return left(new [Nome]AlreadyExistsError())
    }

    this.touch()
    return right(null)
  }

  static create(
    props: Optional<[Nome]Props, 'role' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    const [entity] = new [Nome](
      {
        ...props,
        role: props.role ?? [RoleVO].create('[DEFAULT_ROLE]'),
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

### Value Object de Documento

```typescript
import { ValueObject } from '@/core/entities/value-object'

interface [Document]Props {
  value: string
}

export class [Document] extends ValueObject<[Document]Props> {
  private constructor(props: [Document]Props) {
    super(props)
  }

  static create(value: string): [Document] | left(new Invalid[Document]Error(value)) {
    if (![Document].validate(value)) {
      return left(new Invalid[Document]Error(value))
    }
    return new [Document]({ value })
  }

  static validate(value: string): boolean {
    const [validationLogic]
    return [validationLogic]
  }

  get value() {
    return this.props.value
  }
}
```

### Value Object de Credencial

```typescript
import { ValueObject } from '@/core/entities/value-object'

interface [Credential]Props {
  value: string
}

export class [Credential] extends ValueObject<[Credential]Props> {
  private constructor(props: [Credential]Props) {
    super(props)
  }

  static create(value: string): [Credential] | left(new Invalid[Credential]Error(value)) {
    if (![Credential].validate(value)) {
      return left(new Invalid[Credential]Error(value))
    }
    return new [Credential]({ value })
  }

  static validate(value: string): boolean {
    const hasMinLength = value.length >= [min]
    const hasUppercase = /[A-Z]/.test(value)
    const hasNumber = /[0-9]/.test(value)
    const hasSpecial = /[!@#$%^&*]/.test(value)
    return hasMinLength && hasUppercase && hasNumber && hasSpecial
  }

  get value() {
    return this.props.value
  }
}
```

### Value Object de Role

```typescript
import { ValueObject } from '@/core/entities/value-object'

interface [Role]Props {
  value: string
}

export class [Role] extends ValueObject<[Role]Props> {
  private constructor(props: [Role]Props) {
    super(props)
  }

  static create(role?: string): [Role] {
    return new [Role]({ value: role ?? '[DEFAULT_ROLE]' })
  }

  static roles(): string[] {
    return ['[ROLE_A]', '[ROLE_B]']
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
export class [Nome]AlreadyExistsError extends Error {
  constructor([field]: string) {
    super(`[Entity] with [field] ${[field]} already exists.`)
  }
}

export class [Nome]NotFoundError extends Error {
  constructor([field]: string) {
    super(`[Entity] with [field] ${[field]} not found.`)
  }
}

export class Invalid[VO]Error extends Error {
  constructor([value]: string) {
    super(`Invalid [VO] format: ${[value]}. [VO] must [requirement].`)
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.')
  }
}
```

### Onde criar erros

```
enterprise/
├── entities/
│   └── [entity].ts
    └── errors/
        ├── [entity]-already-exists-error.ts
        ├── [entity]-not-found-error.ts
        ├── invalid-[vo]-error.ts
        └── invalid-credentials-error.ts
```

### Padrão da mensagem

| Erro          | Formato                                                  |
| ------------- | -------------------------------------------------------- |
| AlreadyExists | "[Entity] with [field] [value] already exists."          |
| NotFound      | "[Entity] with [field] [value] not found."               |
| InvalidFormat | "Invalid [VO] format: [value]. [VO] must [requirement]." |

---

## TIPO EITHER NOS MÉTODOS

Quando um método pode falhar, retorne Either:

```typescript
type [Action]Result = Either<
  Invalid[VO]Error | [Entity]AlreadyExistsError,
  [Entity]
>

public [action]([param]: string): [Action]Result {
  if (![VO].validate([param])) {
    return left(new Invalid[VO]Error([param]))
  }

  if (await this.[repository].findBy[Field]([param])) {
    return left(new [Entity]AlreadyExistsError([param]))
  }

  return right([entity])
}
```

### Benefícios

1. **Explícito** → quem usa sabe que pode falhar
2. **Type-safe** → TypeScript ajuda a tratar erros
3. **Composto** → pode encadear validações
