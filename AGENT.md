# FAST FEET

Sistema de controle de entregas (logística).

## O QUE É

Um sistema onde:

- **Admin** cadastra encomendas e destinatários
- **Entregador** retira e entrega encomendas
- O sistema controla o ciclo de vida de cada encomenda

## STACK

| Tecnologia | Uso                     |
| ---------- | ----------------------- |
| NestJS     | Framework               |
| TypeScript | Linguagem               |
| Vitest     | Testes                  |
| Prisma     | Banco de dados (futuro) |

## ARQUITETURA

```
src/
├── core/        # Compartilhado (Entity, Either, tipos)
├── domain/      # Regras de negócio
└── infra/       # Controllers, banco (futuro)
```

### Regras Importantes

1. **Isolamento:** `core/` e `domain/` nunca importam de `infra/`
2. **Imports:** Sempre paths absolutos (`@/core/`, `@/domain/`)
3. **Fluxo:** Camadas externas conhecem internas, nunca o contrário

## PADRÃO DE NOMES

| Tipo         | Exemplo de arquivo     | Exemplo de classe      |
| ------------ | ---------------------- | ---------------------- |
| Entity       | `order.ts`             | `Order`                |
| Value Object | `order-status.ts`      | `OrderStatus`          |
| Use Case     | `register-order.ts`    | `RegisterOrderUseCase` |
| Repository   | `orders-repository.ts` | `OrdersRepository`     |
| Error        | `not-found-error.ts`   | `NotFoundError`        |
| Factory      | `make-order.ts`        | `makeOrder()`          |

## ONDE COMEÇAR

Cada pasta tem seu `AGENT.md` com o guia específico:

- `src/core/` → Tipos base (Entity, Either, etc)
- `src/domain/` → Conceitos DDD
- `src/domain/logistics/` → Domínio de negócio
- `test/` → Como testar
