# IAM (Identity and Access Management)

Domínio de autenticação e gerenciamento de usuários.

## O QUE É

Sistema de gestão de usuários com autenticação por documento/senha e controle de acesso baseado em roles.

- Admin: gerencia entregadores e pedidos
- DeliveryDriver: realiza entregas

## ENTIDADES DO DOMÍNIO

| Entidade | Descrição                                | Identidade                 |
| -------- | ---------------------------------------- | -------------------------- |
| **User** | Usuário do sistema (Admin ou Entregador) | ID único + documento único |

## ROLES

| Role              | Descrição                |
| ----------------- | ------------------------ |
| `ADMIN`           | Administrador do sistema |
| `DELIVERY_DRIVER` | Entregador               |

## VALUE OBJECTS

### [DocumentType]

Local: `src/domain/iam/enterprise/entities/values-objects/[document].ts`

Validações na criação:

- Formato específico (ex: X dígitos numéricos)
- Validação de dígitos verificadores (quando aplicável)

### [CredentialType]

Local: `src/domain/iam/enterprise/entities/values-objects/[credential].ts`

Validações na criação:

- Comprimento mínimo
- Requisitos de complexidade (maiúsculas, números, especiais)
- Padrões de segurança

## USE CASES DISPONÍVEIS

| Categoria         | Descrição                                 |
| ----------------- | ----------------------------------------- |
| **Autenticação**  | Login com documento e senha               |
| **CRUD Usuários** | Criar, buscar, listar, atualizar, deletar |

## CONTRATOS (INTERFACES)

### UsersRepository

Local: `src/domain/iam/application/repositories/users-repository.ts`

Métodos disponíveis:

| Método           | Descrição            |
| ---------------- | -------------------- |
| `findById`       | Buscar por ID        |
| `findByDocument` | Buscar por documento |
| `findMany`       | Listar com paginação |
| `count`          | Contar total         |
| `create`         | Criar novo           |
| `save`           | Atualizar existente  |
| `delete`         | Soft delete          |

### Cryptography

| Interface         | Descrição              |
| ----------------- | ---------------------- |
| **HashGenerator** | Gera hash de senha     |
| **HashComparer**  | Compara senha com hash |

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

Interfaces de use case devem seguir o padrão:

```typescript
interface [Action]Request {
  [field]: [Type]
}

type [Action]Response = Either<[Error], { [entity]: [Entity] }>
```

### Desestruturação no Execute

O método execute deve desestruturar o objeto de entrada:

```typescript
// ✅ Correto
async execute({ [field] }: [Action]Request): Promise<[Action]Response> {
  const [entity] = await this.[repository].findBy[Field]([field])
}

// ❌ Incorreto
async execute(input: [Action]Request): Promise<[Action]Response> {
  const [entity] = await this.[repository].findBy[Field](input.[field])
}
```

### Validação com VOs

Validações de domínio devem usar os VOs:

```typescript
// ✅ Correto - usa [VO].validate()
if (![VO].validate([value])) {
  return left(new Invalid[VO]Error([value]))
}

// ❌ Incorreto - lógica inline
if (!/[pattern]/.test([value])) {
  return left(new Invalid[VO]Error([value]))
}
```

### Erros Customizados

Erros não devem ter `this.name`:

```typescript
// ✅ Correto
export class Invalid[VO]Error extends Error {
  constructor([value]: [Type]) {
    super(`Invalid [VO] format: ${[value]}. [VO] must [requirement].`)
  }
}

// ❌ Incorreto
export class Invalid[VO]Error extends Error {
  constructor([value]: [Type]) {
    super(`Invalid [VO] format: ${[value]}. [VO] must [requirement].`)
    this.name = 'Invalid[VO]Error'
  }
}
```

### Soft Delete

Usuários deletados:

- Não aparecem em buscas
- Não aparecem em listas
- `isDeleted` retorna `true`
- `deletedAt` contém a data de exclusão

## ERROS DISPONÍVEIS

| Erro                       | Causa                            |
| -------------------------- | -------------------------------- |
| `Invalid[VO]Error`         | [VO] não atende formato          |
| `InvalidCredentialError`   | Credencial não atende requisitos |
| `EntityAlreadyExistsError` | [Document] já cadastrado         |
| `EntityNotFoundError`      | Usuário não encontrado           |
| `InvalidCredentialsError`  | Credenciais incorretas           |

## INJEÇÃO DE DEPENDÊNCIAS

Use cases recebem dependências via constructor:

```typescript
// Interface [Repository] (contrato)
class [Action][Entity]UseCase {
  constructor(
    private [repository]: [Repository],
    private [service]: [ServiceInterface],
  ) {}
}

// Infraestrutura implementa o contrato
class [Implementation] implements [ServiceInterface] {
  async [method]([param]: [Type]): Promise<[Return]> {
    // implementação
  }
}

// Uso
const useCase = new [Action][Entity]UseCase(
  new [Repository]Implementation(),
  new [Service]Implementation(),
)
```

## FACTORIES DE TESTE

Usar factory para criar entidades nos testes:

```typescript
import { make[Entity] } from '@test/factories/make-[entity]'
import { faker } from '@faker-js/faker'

// Criar entidade com dados faker
const [entity] = make[Entity]({
  [field]: faker.[fakerMethod](),
  [anotherField]: faker.[anotherMethod](),
})

// Usar credencial padrão nos testes de autenticação
await [authenticate].execute({
  [documentField]: [entity].[documentField],
  password: DEFAULT_PASSWORD,
})
```

---

## DETALHES IMPLEMENTAÇÃO

Para implementação, veja:

- [enterprise/AGENT.md](./enterprise/AGENT.md) → Entities, VOs, Errors
- [application/AGENT.md](./application/AGENT.md) → Use Cases, Repositories
