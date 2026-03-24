# CORE ENTITIES

Classes bases para Domain-Driven Design.

## ENTITY

Objeto com **identidade própria** (comparado por ID).

**Quando usar:** Quando o objeto precisa ser único e rastreável.

**Exemplos:** Order, Recipient, User

### Como criar uma Entity

```typescript
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

// 1. Definir a interface de props
interface OrderProps {
  recipientId: UniqueEntityId
  status: OrderStatus
  deliveryDriveId?: UniqueEntityId
  createdAt: Date
  updatedAt?: Date
  pickedAt?: Date
  deliveredAt?: Date
}

// 2. Criar classe herdando de Entity
export class Order extends Entity<OrderProps> {
  // Getters públicos para ler dados
  get status() {
    return this.props.status
  }

  get recipientId() {
    return this.props.recipientId
  }

  // Métodos de domínio (comportamentos)
  public pickUp(driverId: UniqueEntityId): void {
    // lógica...
  }

  // Factory method (como criar instâncias)
  static create(props: Optional<OrderProps, 'createdAt'>, id?: UniqueEntityId) {
    return new Order(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
```

### Características importantes

- `props` são **protegidos** (não acesso direto externo)
- ID é **gerado automaticamente** se não informado
- `equals()` compara por ID (não por valores)
- Use `static create()` para criar instâncias

---

## VALUE OBJECT

Objeto **imutável**, comparado por seus valores.

**Quando usar:** Quando o objeto é definido pelos seus atributos, não por identidade.

**Exemplos:** OrderStatus, Document, Address

### Como criar um Value Object

```typescript
import { ValueObject } from '@/core/entities/value-object'

interface OrderStatusProps {
  value: string
}

export class OrderStatus extends ValueObject<OrderStatusProps> {
  // Construtor privado - só cria via factory
  private constructor(props: OrderStatusProps) {
    super(props)
  }

  // Factory method
  static create(status?: string): OrderStatus {
    return new OrderStatus({ value: status ?? 'CREATED' })
  }

  // Métodos de domínio
  canTransitionTo(target: string): boolean {
    const transitions: Record<string, string[]> = {
      CREATED: ['WAITING'],
      WAITING: ['PICKED_UP'],
      PICKED_UP: ['DELIVERED', 'RETURNED'],
      DELIVERED: [],
      RETURNED: ['WAITING'],
    }
    return transitions[this.value]?.includes(target) ?? false
  }

  // Getter para valor
  get value() {
    return this.props.value
  }
}
```

### Características importantes

- **Imutável** (sem setters públicos)
- Criado **sempre via factory** (`static create()`)
- `equals()` compara por `JSON.stringify(props)`
- Métodos retornam **novos objetos** (não modificam)

---

## UNIQUE ENTITY ID

Wrapper para UUIDs.

```typescript
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

// Gerar novo ID
const id = new UniqueEntityId()

// Usar ID existente
const id = new UniqueEntityId('custom-uuid-string')

// Métodos úteis
id.toString() // "uuid-string"
id.toValue() // "uuid-string"
id.equals(other) // boolean
```

---

## PADRÃO: GETTERS VS PROPS

```typescript
// ❌ Não faça isso (expor props diretamente)
export class Order extends Entity<OrderProps> {
  props = this.props // Não!
}

// ✅ Faça assim (acesso controlado via getters)
export class Order extends Entity<OrderProps> {
  get status() {
    return this.props.status
  }
}
```
