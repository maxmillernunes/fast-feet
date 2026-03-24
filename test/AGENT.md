# TESTES

Como escrever testes unitários para este projeto.

---

## FERRAMENTAS

| Ferramenta           | Uso                       |
| -------------------- | ------------------------- |
| Vitest               | Runner de testes          |
| In-Memory Repository | Simular persistência      |
| Factories            | Criar instâncias de teste |

---

## COMO USAR FACTORIES

Factories criam instâncias com dados padrão.

### makeOrder

```typescript
import { makeOrder } from '@test/factories/make-order'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'

// Com valores padrão (status = WAITING)
const order = makeOrder()

// Com overrides
const order = makeOrder({
  status: OrderStatus.create('PICKED_UP'),
  deliveryDriveId: new UniqueEntityId('driver-1'),
})

// Com ID específico
const order = makeOrder({}, new UniqueEntityId('custom-id'))
```

### makeRecipient

```typescript
import { makeRecipient } from '@test/factories/make-recipient'

// Com valores padrão
const recipient = makeRecipient()

// Com overrides
const recipient = makeRecipient({
  name: 'John Doe',
  latitude: -23.5505,
  longitude: -46.6333,
})
```

---

## COMO USAR IN-MEMORY REPOSITORY

Repositórios em memória simulam o banco para testes.

### Setup típico

```typescript
let ordersRepository: InMemoryOrdersRepository
let recipientsRepository: InMemoryRecipientsRepository

beforeEach(() => {
  recipientsRepository = new InMemoryRecipientsRepository()
  ordersRepository = new InMemoryOrdersRepository(recipientsRepository)
})
```

### Métodos disponíveis

```typescript
// Criar
await ordersRepository.create(order)

// Buscar
await ordersRepository.findById('order-id')

// Salvar (update)
await ordersRepository.save(order)

// Deletar
await ordersRepository.delete(order)

// Listar
await ordersRepository.findManyRecent({ page: 1, perPage: 10 })
```

---

## PADRÃO DE TESTE

Siga o padrão AAA: Arrange → Act → Assert

### Estrutura básica

```typescript
describe('Register Order', () => {
  let ordersRepository: InMemoryOrdersRepository
  let sut: RegisterOrderUseCase

  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository(/* ... */)
    sut = new RegisterOrderUseCase(ordersRepository)
  })

  it('should create an order with WAITING status', async () => {
    // Arrange - preparar dados
    const recipient = makeRecipient()
    await ordersRepository.create(recipient)

    // Act - executar ação
    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: recipient.id.toString(),
    })

    // Assert - verificar resultado
    expect(result.isRight()).toBe(true)
  })

  it('should fail when recipient not found', async () => {
    // Act
    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'invalid-id',
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
```

### Testando erros

```typescript
it('should fail with OrderCanNotTransitionError', async () => {
  // Arrange - criar order no estado errado
  const order = makeOrder({ status: OrderStatus.create('DELIVERED') })
  await ordersRepository.create(order)

  // Act
  const result = await sut.execute({ orderId: order.id.toString() })

  // Assert
  expect(result.isLeft()).toBe(true)
  expect(result.value).toBeInstanceOf(OrderCanNotTransitionError)
})
```

### Testando sucesso com dados

```typescript
it('should return order with updated status', async () => {
  const order = makeOrder({ status: OrderStatus.create('CREATED') })
  await ordersRepository.create(order)

  const result = await sut.execute({ orderId: order.id.toString() })

  expect(result.isRight()).toBe(true)
  if (result.isRight()) {
    expect(result.value.order.status.value).toBe('WAITING')
    expect(result.value.order.updatedAt).toBeInstanceOf(Date)
  }
})
```

---

## BOAS PRÁTICAS

### 1. Um assert por teste (quando possível)

```typescript
// ❌ Um teste com muitos asserts
it('should create order', async () => {
  expect(result.isRight()).toBe(true)
  expect(order.status).toBe('WAITING')
  expect(order.updatedAt).toBeDefined()
  expect(order.id).toBeDefined()
})

// ✅ Um conceito por teste
it('should return success', async () => {
  expect(result.isRight()).toBe(true)
})

it('should set status to WAITING', async () => {
  expect(result.value.order.status.value).toBe('WAITING')
})
```

### 2. Nomes descritivos

```typescript
// ❌ Genérico
it('should work', async () => { ... })

// ✅ Descritivo
it('should return OrderCanNotTransitionError when status is DELIVERED', async () => { ... })
```

### 3. Setup limpo com beforeEach

```typescript
describe('UseCase', () => {
  let repository: InMemoryRepository
  let sut: UseCase

  beforeEach(() => {
    // Recria tudo a cada teste
    repository = new InMemoryRepository()
    sut = new UseCase(repository)
  })

  // Testes...
})
```

---

## ESTRUTURA DE PASTAS

```
test/
├── factories/
│   ├── make-order.ts         # Cria Order
│   └── make-recipient.ts     # Cria Recipient
├── repositories/
│   ├── in-memory-orders-repository.ts
│   └── in-memory-recipients-repository.ts
└── utils/
    └── get-distance-between-coordinates.ts
```

### Regra importante

Use `@test/` como path alias:

```typescript
import { makeOrder } from '@test/factories/make-order'
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
```
