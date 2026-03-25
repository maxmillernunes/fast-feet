# Delivery Driver Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar verificação de autorização (role ADMIN) a todos os use cases de delivery driver

**Architecture:** Adicionar parâmetro `userId` em cada use case. Na execução, buscar o usuário e verificar se role é ADMIN. Se não for, retornar `NotAllowedError`.

**Tech Stack:** TypeScript, Vitest

---

## Task 1: CreateDeliveryDriverUseCase

**Files:**

- Modify: `src/domain/iam/application/use-cases/create-delivery-driver.ts`
- Modify: `src/domain/iam/application/use-cases/create-delivery-driver.spec.ts`

- [ ] **Step 1: Modificar interface CreateDeliveryDriverRequest**

Adicionar `userId` na interface:

```typescript
interface CreateDeliveryDriverRequest {
  userId: string
  name: string
  cpf: string
  password: string
}
```

Adicionar `NotAllowedError` no import:

```typescript
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
```

- [ ] **Step 2: Modificar método execute**

Adicionar verificação no início:

```typescript
async execute({
  userId,
  name,
  cpf,
  password,
}: CreateDeliveryDriverRequest): Promise<CreateDeliveryDriverResponse> {
  const currentUser = await this.usersRepository.findById(userId)
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return left(new NotAllowedError())
  }

  // resto do código existente...
}
```

- [ ] **Step 3: Atualizar testes**

No `create-delivery-driver.spec.ts`:

1. Importar `NotAllowedError` e `makeUser`
2. Adicionar teste para usuário não-admin:

```typescript
it('should not be able to create a delivery driver if user is not admin', async () => {
  const nonAdmin = makeUser({ role: UserRole.DELIVERY_DRIVER })
  vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce(nonAdmin)

  const result = await sut.execute({
    userId: nonAdmin.id.toString(),
    name: 'John Doe',
    cpf: '12345678909',
    password: 'password123',
  })

  expect(result.isLeft()).toBe(true)
  expect(result.value).toBeInstanceOf(NotAllowedError)
})
```

3. Atualizar chamadas existentes no `beforeEach` para incluir `userId: admin.id.toString()`

---

## Task 2: UpdateDeliveryDriverUseCase

**Files:**

- Modify: `src/domain/iam/application/use-cases/update-delivery-driver.ts`
- Modify: `src/domain/iam/application/use-cases/update-delivery-driver.spec.ts`

- [ ] **Step 1: Modificar interface UpdateDeliveryDriverRequest**

```typescript
interface UpdateDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
  name?: string
  password?: string
}
```

- [ ] **Step 2: Modificar método execute**

```typescript
async execute({
  userId,
  deliveryDriverId,
  name,
  password,
}: UpdateDeliveryDriverRequest): Promise<UpdateDeliveryDriverResponse> {
  const currentUser = await this.usersRepository.findById(userId)
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return left(new NotAllowedError())
  }

  // resto do código existente...
}
```

- [ ] **Step 3: Atualizar testes**

Adicionar teste para usuário não-admin e atualizar chamadas existentes.

---

## Task 3: DeleteDeliveryDriverUseCase

**Files:**

- Modify: `src/domain/iam/application/use-cases/delete-delivery-driver.ts`
- Modify: `src/domain/iam/application/use-cases/delete-delivery-driver.spec.ts`

- [ ] **Step 1: Modificar interface DeleteDeliveryDriverRequest**

```typescript
interface DeleteDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
}
```

- [ ] **Step 2: Modificar método execute**

```typescript
async execute({
  userId,
  deliveryDriverId,
}: DeleteDeliveryDriverRequest): Promise<DeleteDeliveryDriverResponse> {
  const currentUser = await this.usersRepository.findById(userId)
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return left(new NotAllowedError())
  }

  // resto do código existente...
}
```

- [ ] **Step 3: Atualizar testes**

---

## Task 4: ListDeliveryDriversUseCase

**Files:**

- Modify: `src/domain/iam/application/use-cases/list-delivery-drivers.ts`
- Modify: `src/domain/iam/application/use-cases/list-delivery-drivers.spec.ts`

- [ ] **Step 1: Modificar interface ListDeliveryDriversRequest**

```typescript
interface ListDeliveryDriversRequest {
  userId: string
  page: number
  perPage: number
}
```

- [ ] **Step 2: Modificar método execute**

```typescript
async execute({
  userId,
  page,
  perPage,
}: ListDeliveryDriversRequest): Promise<ListDeliveryDriversResponse> {
  const currentUser = await this.usersRepository.findById(userId)
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return left(new NotAllowedError())
  }

  // resto do código existente...
}
```

- [ ] **Step 3: Atualizar testes**

---

## Task 5: GetDeliveryDriverUseCase

**Files:**

- Modify: `src/domain/iam/application/use-cases/get-delivery-driver.ts`
- Modify: `src/domain/iam/application/use-cases/get-delivery-driver.spec.ts`

- [ ] **Step 1: Modificar interface GetDeliveryDriverRequest**

```typescript
interface GetDeliveryDriverRequest {
  userId: string
  deliveryDriverId: string
}
```

- [ ] **Step 2: Modificar método execute**

```typescript
async execute({
  userId,
  deliveryDriverId,
}: GetDeliveryDriverRequest): Promise<GetDeliveryDriverResponse> {
  const currentUser = await this.usersRepository.findById(userId)
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return left(new NotAllowedError())
  }

  // resto do código existente...
}
```

- [ ] **Step 3: Atualizar testes**

---

## Task 6: Verificação Final

- [ ] **Step 1: Rodar todos os testes**

```bash
pnpm test -- src/domain/iam/application/use-cases
```

- [ ] **Step 2: Rodar lint**

```bash
pnpm lint
```
