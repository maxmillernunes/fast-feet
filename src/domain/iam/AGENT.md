# IAM (Identity and Access Management)

Domínio de autenticação e gerenciamento de usuários.

## O QUE É

Sistema de gestão de usuários com autenticação por CPF/senha e controle de acesso baseado em roles.

- Admin: gerencia entregadores e pedidos
- DeliveryDriver: realiza entregas

## ENTIDADES DO DOMÍNIO

| Entidade | Descrição                                | Identidade           |
| -------- | ---------------------------------------- | -------------------- |
| **User** | Usuário do sistema (Admin ou Entregador) | ID único + CPF único |

## ROLES

| Role              | Descrição                |
| ----------------- | ------------------------ |
| `ADMIN`           | Administrador do sistema |
| `DELIVERY_DRIVER` | Entregador               |

## VALUE OBJECTS

### Password

Local: `src/domain/iam/enterprise/entities/values-objects/password.ts`

Validações na criação de senha:

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

```typescript
const result = Password.create('ValidPass123!')
if (result.isLeft()) {
  return result.value // InvalidPasswordError
}
const password = result.value
```

### Cpf

Local: `src/domain/iam/enterprise/entities/values-objects/cpf.ts`

Validação de formato:

- Exatamente 11 dígitos numéricos

```typescript
if (!Cpf.validate(cpf)) {
  return left(new InvalidCpfError(cpf))
}
```

## USE CASES DISPONÍVEIS

| Use Case                      | Descrição                      |
| ----------------------------- | ------------------------------ |
| `AuthenticateUseCase`         | Login com CPF e senha          |
| `CreateDeliveryDriverUseCase` | Criar entregador               |
| `GetDeliveryDriverUseCase`    | Buscar entregador por ID       |
| `ListDeliveryDriversUseCase`  | Listar entregadores (paginado) |
| `UpdateDeliveryDriverUseCase` | Atualizar entregador           |
| `DeleteDeliveryDriverUseCase` | Soft delete de entregador      |

## CONTRATOS (INTERFACES)

### UsersRepository

Local: `src/domain/iam/application/repositories/users-repository.ts`

```typescript
abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByCpf(cpf: string): Promise<User | null>
  abstract findMany(params: PaginationParams): Promise<User[]>
  abstract count(): Promise<number>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
```

### HashGenerator

Local: `src/domain/iam/application/cryptography/hash-generator.ts`

```typescript
abstract class HashGenerator {
  abstract generate(plain: string): Promise<string>
}
```

### HashComparer

Local: `src/domain/iam/application/cryptography/hash-comparer.ts`

```typescript
abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
}
```

## PADRÕES DE CÓDIGO

### Imports de Classes Abstratas

Classes abstratas (contratos) devem ser importadas sem `type`:

```typescript
// ✅ Correto
import { UsersRepository } from '../repositories/users-repository'
import { HashGenerator } from '../cryptography/hash-generator'

// ❌ Incorreto
import type { UsersRepository } from '../repositories/users-repository'
```

### Interface Request/Response

Interfaces de use case devem seguir o padrão `NomeDoUseCaseRequest` e `NomeDoUseCaseResponse`:

```typescript
interface AuthenticateRequest {
  cpf: string
  password: string
}

type AuthenticateResponse = Either<InvalidCredentialsError, { user: User }>
```

### Desestruturação no Execute

O método execute deve desestruturar o objeto de entrada:

```typescript
// ✅ Correto
async execute({ cpf, password }: AuthenticateRequest): Promise<AuthenticateResponse> {
  const user = await this.usersRepository.findByCpf(cpf)
  // ...
}

// ❌ Incorreto
async execute(input: AuthenticateRequest): Promise<AuthenticateResponse> {
  const user = await this.usersRepository.findByCpf(input.cpf)
  // ...
}
```

### Validação com VOs

Validações de domínio devem usar os VOs:

```typescript
// ✅ Correto - usa Cpf.validate()
if (!Cpf.validate(cpf)) {
  return left(new InvalidCpfError(cpf))
}

// ❌ Incorreto - lógica inline
if (!/^\d{11}$/.test(cpf)) {
  return left(new InvalidCpfError(cpf))
}
```

### Erros Customizados

Erros não devem ter `this.name`:

```typescript
// ✅ Correto
export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF format: ${cpf}. CPF must have exactly 11 digits.`)
  }
}

// ❌ Incorreto
export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF format: ${cpf}. CPF must have exactly 11 digits.`)
    this.name = 'InvalidCpfError'
  }
}
```

### Soft Delete

Usuários deletados:

- Não aparecem em buscas
- Não aparecem em listas
- `isDeleted` retorna `true`
- `deletedAt` contém a data de exclusão

## PADRÃO DE USO DOS USE CASES

```typescript
// Exemplo: Criar entregador
const createUseCase = new CreateDeliveryDriverUseCase(
  usersRepository,
  hashGenerator,
)

const result = await createUseCase.execute({
  name: 'João Silva',
  cpf: '12345678901',
  password: 'SecurePass123!',
})

if (result.isLeft()) {
  // Tratar erro
  console.log(result.value)
} else {
  // Sucesso
  const user = result.value.user
}
```

## ERROS DISPONÍVEIS

| Erro                      | Causa                       |
| ------------------------- | --------------------------- |
| `InvalidCpfError`         | CPF não tem 11 dígitos      |
| `InvalidPasswordError`    | Senha não atende requisitos |
| `UserAlreadyExistsError`  | CPF já cadastrado           |
| `UserNotFoundError`       | Usuário não encontrado      |
| `InvalidCredentialsError` | CPF ou senha incorretos     |

## INJEÇÃO DE DEPENDÊNCIAS

Use cases recebem dependências via constructor:

```typescript
// Interface HashGenerator (contrato)
class CreateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator, // Interface
  ) {}
}

// Infraestrutura implementa o contrato
class BcryptHashGenerator implements HashGenerator {
  async generate(plain: string): Promise<string> {
    return bcrypt.hash(plain, 8)
  }
}

// Uso
const useCase = new CreateDeliveryDriverUseCase(
  new PrismaUsersRepository(),
  new BcryptHashGenerator(),
)
```

## FACTORIES DE TESTE

Usar `makeUser()` do factory para criar usuários nos testes:

```typescript
import { makeUser, DEFAULT_PASSWORD } from '@test/factories/make-user'
import { faker } from '@faker-js/faker'

// Criar usuário com dados faker
const user = makeUser({
  cpf: faker.string.numeric(11),
  name: faker.person.fullName(),
})

// Usar senha padrão nos testes de autenticação
await authenticate.execute({
  cpf: user.cpf,
  password: DEFAULT_PASSWORD,
})
```
