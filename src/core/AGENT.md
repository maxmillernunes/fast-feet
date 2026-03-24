# CORE

Camada compartilhada por todo o projeto.

## O QUE CONTÉM

```
core/
├── either.ts           # Lidando com erros de forma funcional
├── entities/           # Entity e ValueObject (bases para domínio)
├── errors/             # Erros genéricos
├── types/              # Tipos utilitários
└── repositories/        # Interfaces genéricas (ex: paginação)
```

---

## EITHER MONAD

O Either é como um `try-catch` funcional. Ele representa sucesso ou falha.

### Conceito

- **Left** = Falha (erro)
- **Right** = Sucesso (dado)

### Como usar

```typescript
import { left, right, type Either } from '@/core/either'

// Returnar falha
return left(new ResourceNotFoundError())

// Retornar sucesso
return right({ order })
```

### Tipos

```typescript
// "Ou retorna erro Ou retorna dados"
type Result = Either<ErrorType, SuccessData>

// Exemplo prático
type Response = Either<
  ResourceNotFoundError | NotAllowedError,
  { order: Order }
>
```

### Tratando o resultado

```typescript
const result = await useCase.execute(request)

if (result.isLeft()) {
  // Deu errado - tratar erro
  const error = result.value
  return
}

// Deu certo - usar o dado
const { order } = result.value
```

---

## PAGINATION

Parâmetros para listagens paginadas.

```typescript
interface PaginationParams {
  page: number // Página atual (começa em 1)
  perPage: number // Itens por página
}
```

---

## OPTIONAL TYPE

Tipo que torna propriedades opcionais em interfaces.

```typescript
import type { Optional } from '@/core/types/optional'

// createdAt e updatedAt são opcionais na criação
type OrderProps = Optional<BaseOrderProps, 'createdAt' | 'updatedAt'>
```

---

## VALOR PADRÃO EM PARÂMETROS

Quando criar use cases, use valores padrão para paginação:

```typescript
async execute({
  page = 1,
  perPage = 10,
}: Request): Promise<Response> {
  // page e perPage sempre terão valor
}
```
