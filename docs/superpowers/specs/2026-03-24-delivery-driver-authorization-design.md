# Design: Autorização de CRUD de Delivery Driver

## Problema

Os use cases de delivery driver (create, update, delete, list, get) não verificam se o usuário que está fazendo a requisição tem permissão para isso. O CRUD deve ser acessível apenas por admin.

## Solução

Adicionar parâmetro `userId` a todos os use cases de delivery driver. Na execução, buscar o usuário, verificar se role é `ADMIN`. Se não for, retornar `NotAllowedError`.

## Alterações

### Use cases afetados

- `CreateDeliveryDriverUseCase`
- `UpdateDeliveryDriverUseCase`
- `DeleteDeliveryDriverUseCase`
- `ListDeliveryDriversUseCase`
- `GetDeliveryDriverUseCase`

### Interface de cada use case

```typescript
// Exemplo CreateDeliveryDriverRequest
interface CreateDeliveryDriverRequest {
  userId: string // usuário logado fazendo a requisição
  name: string
  cpf: string
  password: string
}
```

### Lógica de autorização

Em cada use case, adicionar no início do execute:

```typescript
const currentUser = await this.usersRepository.findById(userId)
if (!currentUser || currentUser.role !== UserRole.ADMIN) {
  return left(new NotAllowedError())
}
```

### Tests

Atualizar todas as chamadas nos specs para incluir o novo parâmetro `userId`, e adicionar teste específico para cenário de usuário não-admin.
