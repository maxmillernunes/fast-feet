# DOMAIN

Repositório de domínios bounded context.

## O QUE CONTÉM

```
src/domain/
└── [contexto]/
    ├── AGENT.md              # Conceitos do domínio
    ├── application/
    │   └── AGENT.md          # Templates: Use Cases, Repositories
    └── enterprise/
        └── AGENT.md          # Templates: Entities, VOs, Errors
```

## DOMÍNIOS EXISTENTES

| Domínio          | Descrição               | Documentação                                     |
| ---------------- | ----------------------- | ------------------------------------------------ |
| **iam**          | Autenticação e usuários | [iam/AGENT.md](./iam/AGENT.md)                   |
| **logistics**    | Gestão de entregas      | [logistics/AGENT.md](./logistics/AGENT.md)       |
| **notification** | Notificações            | [notification/AGENT.md](./notification/AGENT.md) |

---

## COMO ADICIONAR NOVO DOMÍNIO

Para criar um novo domínio, siga a estrutura:

```
src/domain/[nome]/
├── AGENT.md                    # Conceitos do domínio
├── enterprise/
│   ├── AGENT.md                # Entities, VOs, Errors
│   └── events/                 # Domain Events (se aplicável)
│       └── AGENT.md
└── application/
    ├── AGENT.md                # Use Cases, Repositories
    └── subscribers/             # Event Handlers (se aplicável)
```

---

## TEMPLATE: DOMÍNIO

Cada domínio deve ter um `AGENT.md` com:

```markdown
# [NOME]

## O QUE É

(Visão geral - 2-3 frases)

## ENTIDADES DO DOMÍNIO

| Entidade | Descrição | Identidade |
| -------- | --------- | ---------- |

## CONCEITOS-CHAVE

- Conceito 1
- Conceito 2

## FLUXO PRINCIPAL

(Diagrama ASCII ou texto)

## STATUS/ESTADOS POSSÍVEIS

| Status | Significado | Quem transita |
| ------ | ----------- | ------------- |

## PAPÉIS E PERMISSÕES

| Ação | Role A | Role B |
| ---- | ------ | ------ |

## COMPORTAMENTOS PRINCIPAIS

(Descrição das principais regras - sem código)

## VALIDAÇÕES IMPORTANTES

(Regras de negócio - sem código)
```

---

## TEMPLATE: ENTERPRISE LAYER

Cada domínio deve ter um `enterprise/AGENT.md` com:

````markdown
# [NOME] ENTERPRISE

Entities, Value Objects e erros específicos do domínio.

---

## COMO CRIAR ENTITY

### Props

Props são os dados que a entidade carrega.

```typescript
export interface [Nome]Props {
  field: Type
  createdAt: Date
  updatedAt?: Date
}
```
````

### Classe

```typescript
export class [Nome] extends Entity<[Nome]Props> {
  get field() { return this.props.field }

  private touch() { this.props.updatedAt = new Date() }

  public [action](): Either<[Error], null> {
    // lógica
  }

  static create(props: Optional<[Nome]Props, ...>, id?: UniqueEntityId) {
    return new [Nome]({ ...props }, id)
  }
}
```

### Regras

- Props são protegidos → use getters
- Use `private touch()` → atualiza updatedAt
- Métodos retornam Either → sucesso ou erro
- Use `static create()` → para criar instâncias

---

## COMO CRIAR VALUE OBJECT

### Estrutura

```typescript
export class [Nome] extends ValueObject<[Props]> {
  private constructor(props: [Props]) { super(props) }

  static create(value?: string): [Nome] {
    return new [Nome]({ value: value ?? 'DEFAULT' })
  }

  get value() { return this.props.value }
}
```

### Regras

- Imutável → sem setters
- Construtor privado → só cria via static create()
- Comparado por valor → equals()

---

## COMO CRIAR ERROS

### Estrutura

```typescript
export class [Nome]Error extends Error {
  constructor(message: string) {
    super(message)
  }
}
```

### Padrão de mensagem

"Entity deve estar em STATUS para AÇÃO."

---

## TEMPLATE: APPLICATION LAYER

Cada domínio deve ter um `application/AGENT.md` com:

````markdown
# [NOME] APPLICATION

Use Cases e Repositories deste domínio.

---

## COMO CRIAR USE CASE

### Estrutura

```typescript
interface [Action]Request { ... }
type [Action]Response = Either<[Error], { [entity]: [Nome] }>

export class [Action]UseCase {
  constructor(private [repository]: [Repository]) {}

  async execute({ params }: [Action]Request): Promise<[Action]Response> {
    const [entity] = await this.[repository].findById(...)
    if (![entity]) return left(new NotFoundError())

    const result = [entity].[action]()
    if (result.isLeft()) return left(result.value)

    await this.[repository].save([entity])
    return right({ [entity] })
  }
}
```
````

### Padrões

| Parte       | O que fazer                    |
| ----------- | ------------------------------ |
| Request     | Interface com dados de entrada |
| Response    | Either<Erro, Sucesso>          |
| Constructor | Recebe repositório via DI      |
| execute()   | Sempre async                   |

---

## PADRÃO: USE CASE DE LEITURA

```typescript
type Response = Either<null, { [entities]: [Nome][] }>

async execute({ page, perPage }): Promise<Response> {
  const [entities] = await this.[repository].findMany(...)
  return right({ [entities] })
}
```

---

## PADRÃO: USE CASE DE ESCRITA

```typescript
type Response = Either<[Error], { [entity]: [Nome] }>

async execute({ ...params }): Promise<Response> {
  const [entity] = await this.[repository].findById(...)
  if (![entity]) return left(new NotFoundError())

  const result = [entity].[action]()
  if (result.isLeft()) return left(result.value)

  await this.[repository].save([entity])
  return right({ [entity] })
}
```

---

## COMO CRIAR REPOSITORY

### Interface

```typescript
export abstract class [Nome]Repository {
  abstract findById(id: string): Promise<[Nome] | null>
  abstract findMany(params: PaginationParams): Promise<[Nome][]>
  abstract create([entity]: [Nome]): Promise<void>
  abstract save([entity]: [Nome]): Promise<void>
  abstract delete([entity]: [Nome]): Promise<void>
}
```

### Implementação In-Memory

```typescript
export class InMemory[Nome]Repository implements [Nome]Repository {
  public items: [Nome][] = []

  async findById(id: string): Promise<[Nome] | null> {
    return this.items.find(item => item.id.toString() === id) ?? null
  }
  // ... outros métodos
}
```

---

## ESTRUTURA DE TESTES

```
application/
├── use-cases/
│   ├── [action]-[entity].ts
│   └── [action]-[entity].spec.ts
└── repositories/
    └── in-memory-[entity]-repository.ts
```

### Padrão AAA

1. **Arrange** → setup, criar dados
2. **Act** → executar a ação
3. **Assert** → verificar resultado

```

---

## REGRAS DE OURO

| Regra | Descrição |
|-------|-----------|
| **Sem código concreto** | Use placeholders: `[Nome]`, `[Entity]`, `[Action]` |
| **Sem nomes reais** | Não use Order, CPF, User - use exemplos genéricos |
| **Domínio autoexplicativo** | Cada AGENT.md faz sentido sozinho |
| **Referências cruzadas** | child AGENT.md mencionados no parent |
```
