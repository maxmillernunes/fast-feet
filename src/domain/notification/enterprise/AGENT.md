# NOTIFICATION ENTERPRISE

Entities específicas do domínio de notificação.

---

## COMO CRIAR ENTITY

### Props

Props são os dados que a entidade carrega.

```typescript
export interface [Entity]Props {
  [field]: UniqueEntityId
  title: string
  content: string
  createdAt: Date
  readAt?: Date
}
```

### Classe

```typescript
import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export class [Entity] extends Entity<[Entity]Props> {
  get [field](): UniqueEntityId {
    return this.props.[field]
  }

  get title(): string {
    return this.props.title
  }

  get content(): string {
    return this.props.content
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get readAt(): Date | undefined {
    return this.props.readAt
  }

  read() {
    this.props.readAt = new Date()
  }

  static create(
    props: Optional<[Entity]Props, 'createdAt'>,
    id?: UniqueEntityId,
  ): [Entity] {
    const [entity] = new [Entity](
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return [entity]
  }
}
```

### Regras

- Getter para cada propriedade
- `read()` → atualiza readAt
- `static create()` → para criar instâncias
- `props.readAt` pode ser undefined até ler
