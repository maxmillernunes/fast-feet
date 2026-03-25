# IAM Domain Design

## Visão Geral

Domínio de Identity and Access Management para autenticação e gerenciamento de usuários (Admin e DeliveryDriver).

## Estrutura de Pastas

```
src/domain/iam/
├── enterprise/
│   ├── entities/
│   │   └── user.ts
│   ├── errors/
│   │   ├── invalid-cpf-error.ts
│   │   ├── invalid-password-error.ts
│   │   ├── user-already-exists-error.ts
│   │   ├── user-not-found-error.ts
│   │   └── invalid-credentials-error.ts
│   └── value-objects/
│       └── password.ts
├── application/
│   ├── cryptography/
│   │   ├── hash-generator.ts (contrato)
│   │   └── hash-comparer.ts (contrato)
│   ├── repositories/
│   │   └── users-repository.ts (contrato)
│   └── use-cases/
│       ├── authenticate.ts
│       ├── create-delivery-driver.ts
│       ├── update-delivery-driver.ts
│       ├── delete-delivery-driver.ts
│       ├── get-delivery-driver.ts
│       └── list-delivery-drivers.ts
```

## Entidades

### User

| Campo     | Tipo                         | Descrição               |
| --------- | ---------------------------- | ----------------------- |
| id        | UniqueEntityId               | Identificador único     |
| name      | string                       | Nome completo           |
| cpf       | string                       | CPF (11 dígitos, único) |
| role      | 'ADMIN' \| 'DELIVERY_DRIVER' | Papel do usuário        |
| password  | Password (VO)                | Senha hasheada          |
| createdAt | Date                         | Data de criação         |
| updatedAt | Date                         | Data de atualização     |
| deletedAt | Date \| null                 | Soft delete             |

### Password (Value Object)

Validações:

- Mínimo 8 caracteres
- 1 letra maiúscula
- 1 número
- 1 caractere especial

Métodos:

- `create(plain: string): Either<InvalidPasswordError, Password>`
- `compare(plain: string): boolean`

## Contratos (Interfaces)

### UsersRepository

```typescript
interface UsersRepository {
  findById(id: string): Promise<User | null>
  findByCpf(cpf: string): Promise<User | null>
  findMany(params: PaginationParams): Promise<User[]>
  create(user: User): Promise<void>
  save(user: User): Promise<void>
  delete(user: User): Promise<void>
}
```

### HashGenerator

```typescript
interface HashGenerator {
  generate(plain: string): Promise<string>
}
```

### HashComparer

```typescript
interface HashComparer {
  compare(plain: string, hash: string): Promise<boolean>
}
```

## Use Cases

### 1. Authenticate (Login)

**Input:**

```typescript
{
  cpf: string
  password: string
}
```

**Output:**

```typescript
{
  user: User
}
```

**Fluxo:**

1. Busca usuário por CPF
2. Compara senha com HashComparer
3. Retorna erro se credenciais inválidas
4. Retorna usuário autenticado

### 2. CreateDeliveryDriver

**Input:**

```typescript
{
  name: string
  cpf: string
  password: string
}
```

**Output:**

```typescript
{
  user: User
}
```

**Fluxo:**

1. Valida dados de entrada
2. Cria Password VO (valida requisitos)
3. Verifica se CPF já existe
4. Gera hash da senha
5. Cria User com role DELIVERY_DRIVER
6. Salva no repositório

### 3. UpdateDeliveryDriver

**Input:**

```typescript
{
  userId: string
  name?: string
  password?: string
}
```

**Output:**

```typescript
{
  user: User
}
```

**Fluxo:**

1. Busca usuário por ID
2. Valida que existe e não está deletado
3. Valida que é DELIVERY_DRIVER
4. Atualiza nome se fornecido
5. Atualiza senha se fornecida (regenera hash)
6. Salva no repositório

### 4. DeleteDeliveryDriver (Soft Delete)

**Input:**

```typescript
{
  userId: string
}
```

**Output:**

```typescript
{
  user: User
}
```

**Fluxo:**

1. Busca usuário por ID
2. Valida que existe e não está deletado
3. Valida que é DELIVERY_DRIVER
4. Define deletedAt com data atual
5. Salva no repositório

### 5. GetDeliveryDriver

**Input:**

```typescript
{
  userId: string
}
```

**Output:**

```typescript
{
  user: User
}
```

### 6. ListDeliveryDrivers

**Input:**

```typescript
{
  page: number
  perPage: number
}
```

**Output:**

```typescript
{
  users: User[]
  total: number
  perPage: number
  page: number
}
```

## Erros

| Erro                    | Uso                         |
| ----------------------- | --------------------------- |
| InvalidCpfError         | CPF com formato inválido    |
| InvalidPasswordError    | Senha não atende requisitos |
| UserAlreadyExistsError  | CPF já cadastrado           |
| UserNotFoundError       | Usuário não encontrado      |
| InvalidCredentialsError | CPF ou senha incorretos     |

## Validações

1. **CPF:** Exatamente 11 dígitos numéricos
2. **Senha:** Mín 8 chars, 1 maiúscula, 1 número, 1 especial
3. **Nome:** Não vazio
4. **Soft Delete:** Usuários deletados não aparecem em listas/buscas

## Permissões RBAC

| Ação                  | Admin | DeliveryDriver |
| --------------------- | ----- | -------------- |
| Login                 | ✅    | ✅             |
| CRUD DeliveryDrivers  | ✅    | ❌             |
| Ver pedidos próximos  | ✅    | ✅             |
| Ver próprias entregas | ❌    | ✅             |
| Alterar própria senha | ✅    | ✅             |

Nota: Admin é criado via seed, sem CRUD de admins.
