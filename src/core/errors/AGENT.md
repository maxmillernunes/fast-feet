# CORE ERRORS

Erros compartilhados do sistema.

## CONTRATO

Todas implementam `UseCaseError`:

```typescript
interface UseCaseError {
  message: string
}
```

## ERROS DISPONÍVEIS

| Erro                         | Uso                    |
| ---------------------------- | ---------------------- |
| `ResourceNotFoundError`      | Recurso não encontrado |
| `NotAllowedError`            | Operação não permitida |
| `ResourceAlreadyExistsError` | Duplicidade de recurso |

## USO EM USE CASES

```typescript
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

// Retorna falha
return left(new ResourceNotFoundError())

// Com contexto
return left(new ResourceNotFoundError('Recipient'))
// Mensagem: "Recipient not found."
```

## CRIAR NOVO ERRO

```typescript
import { UseCaseError } from '@/core/errors/use-case-error'

export class CustomError extends Error implements UseCaseError {
  constructor() {
    super('Custom error message.')
    this.name = 'CustomError'
  }
}
```
