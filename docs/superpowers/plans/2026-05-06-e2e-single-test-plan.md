# E2E Tests - Single Test per Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar testes e2e para 5 controllers com apenas 1 teste por arquivo, seguindo o padrão do upload-attachment.controller.e2e-spec.ts

**Architecture:** Cada arquivo terá estrutura idêntica: beforeAll com setup de app/database/jwt/userFactory, e 1 único test() para o caso de sucesso (happy path).

**Tech Stack:** NestJS, Vitest, Prisma, Supertest

---

## Files Existentes (modificar)

- `src/infra/http/controllers/create-account.controller.ts` - ADICIONAR decorator `@Public()`
- `src/infra/http/controllers/register-delivery-driver.controller.e2e-spec.ts` - REDUZIR para 1 teste
- `src/infra/http/controllers/fetch-delivery-drivers.controller.e2e-spec.ts` - REDUZIR para 1 teste
- `src/infra/http/controllers/get-delivery-drivers.controller.e2e-spec.ts` - REDUZIR para 1 teste
- `src/infra/http/controllers/update-delivery-drivers.controller.e2e-spec.ts` - REDUZIR para 1 teste
- `src/infra/http/controllers/delete-delivery-drivers.controller.e2e-spec.ts` - REDUZIR para 1 teste
- `src/infra/http/controllers/create-account.controller.e2e-spec.ts` - JÁ CORRIGIDO
- `src/infra/http/controllers/authenticate.controller.e2e-spec.ts` - JÁ CORRIGIDO
- `src/infra/http/controllers/upload-attachment.controller.e2e-spec.ts` - JÁ FUNCIONANDO

---

## Task 1: Modificar create-account.controller.ts para adicionar @Public()

**Files:**
- Modify: `src/infra/http/controllers/create-account.controller.ts`

- [ ] **Step 1: Adicionar import do Public decorator**

```typescript
import { Public } from '@/infra/auth/public'
```

- [ ] **Step 2: Adicionar @Public() no método handle**

```typescript
@Post()
@Public()
async handle(@Body(bodyValidationSchema) body: CreateAccountBodySchema) {
```

- [ ] **Step 3: Remover import não utilizado UseGuards**

Verificar se ainda está sendo usado. Se não, remover.

---

## Task 2: Reduzir register-delivery-driver.controller.e2e-spec.ts para 1 teste

**Files:**
- Modify: `src/infra/http/controllers/register-delivery-driver.controller.e2e-spec.ts`

- [ ] **Step 1: Ler arquivo atual e identificar testes existentes**

- [ ] **Step 2: Manter apenas o teste de sucesso, remover testes de erro**

Manter apenas:
```typescript
test('[POST] /delivery-drivers', async () => {
  const admin = await userFactory.makePrismaUser({
    role: UserRole.ADMIN,
  })

  const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

  const response = await request(app.getHttpServer())
    .post('/delivery-drivers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'John Driver',
      email: 'driver@example.com',
      document: '00000000191',
      password: 'Password123!',
    })

  expect(response.status).toBe(201)
})
```

---

## Task 3: Reduzir fetch-delivery-drivers.controller.e2e-spec.ts para 1 teste

**Files:**
- Modify: `src/infra/http/controllers/fetch-delivery-drivers.controller.e2e-spec.ts`

- [ ] **Step 1: Ler arquivo atual e identificar testes existentes**

- [ ] **Step 2: Manter apenas o teste de sucesso**

```typescript
test('[GET] /delivery-drivers', async () => {
  const admin = await userFactory.makePrismaUser({
    role: UserRole.ADMIN,
  })

  const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

  const response = await request(app.getHttpServer())
    .get('/delivery-drivers')
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(200)
  expect(response.body).toEqual({
    drivers: expect.any(Array),
    total: expect.any(Number),
    page: expect.any(Number),
    perPage: expect.any(Number),
  })
})
```

---

## Task 4: Reduzir get-delivery-drivers.controller.e2e-spec.ts para 1 teste

**Files:**
- Modify: `src/infra/http/controllers/get-delivery-drivers.controller.e2e-spec.ts`

- [ ] **Step 1: Ler arquivo atual e identificar testes existentes**

- [ ] **Step 2: Manter apenas o teste de sucesso**

```typescript
test('[GET] /delivery-drivers/:id', async () => {
  const admin = await userFactory.makePrismaUser({
    role: UserRole.ADMIN,
  })

  const driver = await userFactory.makePrismaUser({
    role: UserRole.DRIVER,
  })

  const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

  const response = await request(app.getHttpServer())
    .get(`/delivery-drivers/${driver.id.toString()}`)
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(200)
  expect(response.body).toEqual({
    driver: expect.objectContaining({
      id: driver.id.toString(),
    }),
  })
})
```

---

## Task 5: Reduzir update-delivery-drivers.controller.e2e-spec.ts para 1 teste

**Files:**
- Modify: `src/infra/http/controllers/update-delivery-drivers.controller.e2e-spec.ts`

- [ ] **Step 1: Ler arquivo atual e identificar testes existentes**

- [ ] **Step 2: Manter apenas o teste de sucesso**

```typescript
test('[PUT] /delivery-drivers/:id', async () => {
  const admin = await userFactory.makePrismaUser({
    role: UserRole.ADMIN,
  })

  const driver = await userFactory.makePrismaUser({
    role: UserRole.DRIVER,
  })

  const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

  const response = await request(app.getHttpServer())
    .put(`/delivery-drivers/${driver.id.toString()}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      password: 'NewPass123!',
    })

  expect(response.status).toBe(200)
})
```

---

## Task 6: Reduzir delete-delivery-drivers.controller.e2e-spec.ts para 1 teste

**Files:**
- Modify: `src/infra/http/controllers/delete-delivery-drivers.controller.e2e-spec.ts`

- [ ] **Step 1: Ler arquivo atual e identificar testes existentes**

- [ ] **Step 2: Manter apenas o teste de sucesso**

```typescript
test('[DELETE] /delivery-drivers/:id', async () => {
  const admin = await userFactory.makePrismaUser({
    role: UserRole.ADMIN,
  })

  const driver = await userFactory.makePrismaUser({
    role: UserRole.DRIVER,
  })

  const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

  const response = await request(app.getHttpServer())
    .delete(`/delivery-drivers/${driver.id.toString()}`)
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(200)
})
```

---

## Task 7: Verificar se todos os testes ainda passam

**Files:**
- Test: Rodar `pnpm test:e2e -- --run`

- [ ] **Step 1: Rodar testes e2e**

```bash
pnpm test:e2e -- --run
```

- [ ] **Step 2: Verificar se todos os 8 arquivos passam**

Esperado: 8 test files, ~11 testes passando

---

## Validação Final

Ao final, ter:
- ✅ 8 arquivos de teste e2e funcionando
- ✅ Cada arquivo com apenas 1 teste (exceto upload que já era assim)
- ✅ Tempo de execução menor por arquivo individual
- ✅ Estrutura consistente com upload-attachment.controller.e2e-spec.ts