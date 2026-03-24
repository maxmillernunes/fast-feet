# DOMAIN

Regras de negócio puras (sem dependências de frameworks).

## O QUE CONTÉM

```
src/domain/
└── [contexto]/
    ├── application/   # Use Cases + Repositories
    └── enterprise/     # Entities + Value Objects + Errors
```

## CONCEITOS DDD

| Conceito         | O que é                                     | Exemplo                    |
| ---------------- | ------------------------------------------- | -------------------------- |
| **Entity**       | Objeto com identidade                       | Order, Recipient           |
| **Value Object** | Objeto imutável, comparado por valor        | OrderStatus, Document      |
| **Aggregate**    | Grupo de objetos controlados por uma Entity | Order + Items              |
| **Use Case**     | Uma operação de negócio                     | RegisterOrder, PickUpOrder |
| **Repository**   | Abstração de persistência                   | OrdersRepository           |
| **Domain Event** | Algo que aconteceu no domínio (futuro)      | OrderDelivered             |

## ENTITY VS VALUE OBJECT

```
┌─────────────────────────────────────────────────────────┐
│ ENTITY                                                   │
│ - Tem ID único                                           │
│ - Comparada por ID                                       │
│ - Pode ser modificada                                   │
│ - Ex: Order, User, Product                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ VALUE OBJECT                                            │
│ - NÃO tem ID                                            │
│ - Comparado por seus valores                             │
│ - Imutável                                              │
│ - Ex: Address, Document, OrderStatus                     │
└─────────────────────────────────────────────────────────┘
```

### Exemplo prático

```typescript
// Order é Entity (tem ID, pode mudar)
const order = new Order({ ... })
order.id          // existe
order.pickUp()    // pode modificar

// OrderStatus é Value Object (não tem ID, não muda)
const status = OrderStatus.create('WAITING')
status.equals(OrderStatus.create('WAITING')) // true (por valor)
```

## FLUXO DE CHAMADA

```
┌─────────────┐
│ Controller  │  ← Camada externa (HTTP)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Use Case   │  ← Orquestra operações
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  ← Persistência (futuro)
└─────────────┘
       │
       ▼
┌─────────────┐
│  Entity/VO  │  ← Regras de negócio
└─────────────┘
```

## REGRAS IMPORTANTES

1. **Use Case orquestra, Entity carrega regras**
   - Use Case: fluxo, validações de permissão
   - Entity: regras de negócio puras

2. **Repositórios são interfaces**
   - A implementação fica em `infra/` (futuro)
   - Para testes, use `InMemoryXxxRepository`

3. **Erros pertencem ao domínio certo**
   - Erros genéricos (não encontrado) → `core/errors/`
   - Erros de negócio → `domain/[contexto]/entities/errors/`

## PASTA APPLICATION VS ENTERPRISE

```
application/
├── use-cases/    # Operações de negócio
└── repositories/  # Interfaces de persistência

enterprise/
├── entities/     # Entidades do domínio
├── value-objects/# Objetos de valor
└── errors/       # Erros específicos do domínio
```
