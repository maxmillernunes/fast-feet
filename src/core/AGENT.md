# CORE

Camada compartilhada entre todos os bounded contexts.

## O QUE CONTÉM

```
core/
├── either.ts           # Either<L, R> monad
├── entities/           # Entity, ValueObject, UniqueEntityId
├── errors/             # Erros genéricos (ResourceNotFound, etc)
├── types/              # Utilitários (Optional)
└── repositories/        # Interfaces (PaginationParams)
```

## EITHER MONAD

Functional Error Handling.

```typescript
import { left, right, type Either } from '@/core/either'

// Left = falha
return left(new ResourceNotFoundError())

// Right = sucesso
return right({ order })
```

```typescript
type Result = Either<ErrorType, SuccessData>

const result = await useCase.execute(req)

if (result.isLeft()) {
  // tratar erro
  return
}

// acessar dado
const { order } = result.value
```

## PAGINATION

```typescript
interface PaginationParams {
  page: number
  perPage: number
}
```

## OPTIONAL TYPE

```typescript
import type { Optional } from '@/core/types/optional'

type Props = Optional<EntityProps, 'createdAt' | 'updatedAt'>
// createdAt e updatedAt são opcionais
```
