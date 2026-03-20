# LOGISTICS APPLICATION

Use Cases e Repository Interfaces.

## USE CASE

```typescript
interface Request {
  param1: string
  param2: string
}

type Response = Either<ErrorType | AnotherError, { result: Data }>

export class UseCaseNameUseCase {
  constructor(private repo: Repository) {}

  async execute(req: Request): Promise<Response> {
    // 1. Validar permissões
    if (!hasPermission) {
      return left(new NotAllowedError())
    }

    // 2. Buscar dados
    const data = await this.repo.findById(req.id)
    if (!data) {
      return left(new ResourceNotFoundError())
    }

    // 3. Executar lógica
    const result = data.doSomething()

    // 4. Persistir
    await this.repo.save(result)

    return right({ data: result })
  }
}
```

## REPOSITORY INTERFACE

```typescript
import type { PaginationParams } from '@/core/repositories /pagination-params'

export abstract class OrdersRepository {
  abstract findById(id: string): Promise<Order | null>
  abstract findMany(params: PaginationParams): Promise<Order[]>
  abstract create(order: Order): Promise<void>
  abstract save(order: Order): Promise<void>
  abstract delete(order: Order): Promise<void>
}
```

## ESTRUTURA

```
application/
├── use-cases/       # Um arquivo por operação + teste *.spec.ts na mesma pasta
└── repositories/    # Uma interface por agregado
```

## TESTES

Todo use case deve ter seu arquivo de teste correspondente na mesma pasta:

- `fetch-driver-orders.ts` → `fetch-driver-orders.spec.ts`
- `pickup-order.ts` → `pickup-order.spec.ts`

## PERMISSÕES TÍPICAS

| Use Case                 | Quem pode          |
| ------------------------ | ------------------ |
| Register, Edit, Delete   | ADMIN              |
| PickUp, Delivery, Return | DELIVERYMAN        |
| Fetch                    | ADMIN, DELIVERYMAN |
