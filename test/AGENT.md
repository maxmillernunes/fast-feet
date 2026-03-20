# TESTES

Utilitários para testes unitários.

## FACTORY

Cria instâncias com dados padrão.

```typescript
import { makeOrder } from '@test/factories/make-order'
import { makeRecipient } from '@test/factories/make-recipient'

// Com defaults
const order = makeOrder()

// Com overrides
const order = makeOrder({ status: OrderStatus.create('PICKED_UP') })

// Com ID específico
const order = makeOrder({}, new UniqueEntityId('custom-id'))
```

## IN-MEMORY REPOSITORY

Implementação da interface para isolamento de testes.

```typescript
let ordersRepo: InMemoryOrdersRepository
let recipientsRepo: InMemoryRecipientsRepository

beforeEach(() => {
  recipientsRepo = new InMemoryRecipientsRepository()
  ordersRepo = new InMemoryOrdersRepository(recipientsRepo)
})
```

## PADRÃO DE TESTE

```typescript
describe('Register Order', () => {
  it('should create order', async () => {
    const recipient = makeRecipient()
    await recipientsRepo.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should fail when recipient not found', async () => {
    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'invalid-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
```

## ESTRUTURA

```
test/
├── factories/           # makeXxx()
├── repositories/       # InMemoryXxxRepository
└── utils/              # Helpers (getDistance, etc)
```
