# FastFeet API

API de gerenciamento logístico para uma transportadora fictícia. Gerencia cadastro de usuários (administradores e entregadores), o ciclo de vida completo de encomendas e o registro de destinatários. Construída com **Domain-Driven Design**, **Clean Architecture** e **NestJS**.

---

## Funcionalidades

### IAM (Identity & Access Management)

| Feature | Descrição |
|---------|-----------|
| Cadastro de admin | Criação de conta de administrador |
| Autenticação | Login com CPF + senha, retorna JWT (RS256) |
| CRUD de entregadores | Gerenciamento completo de entregadores (admin only) |

### Recipientes

| Feature | Descrição |
|---------|-----------|
| CRUD de destinatários | Cadastro, edição, listagem, detalhes e remoção (admin only) |

### Pedidos

| Feature | Descrição |
|---------|-----------|
| CRUD de encomendas | Criação, edição, listagem e remoção (admin only) |
| Machine de estados | CREATED → WAITING → PICKED_UP → DELIVERED ou RETURNED |
| Foto na entrega | Obrigatório upload de foto ao marcar como entregue |
| Pedidos próximos | Listagem de encomendas num raio de 10 km do entregador |
| Pedidos por entregador | Filtro por entregador e status |

### Anexos

| Feature | Descrição |
|---------|-----------|
| Upload de arquivos | Upload para AWS S3 (jpg/png/pdf, max 5 MB) |

### Notificações

| Feature | Descrição |
|---------|-----------|
| Eventos de domínio | Notificações disparadas automaticamente em cada transição de status |

### Regras de negócio

- Administrador realiza operações administrativas (CRUD de entregadores, destinatários e encomendas)
- Entregador visualiza e atualiza entregas vinculadas a si
- Entrega exige foto obrigatória
- Apenas o entregador que retirou a encomenda pode marcá-la como entregue
- Entregador não lista encomendas de outro entregador
- Soft delete em usuários, destinatários e encomendas

---

## Tecnologias

### Runtime

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | 22 | Plataforma |
| **TypeScript** | 5.7 | Tipagem |
| **NestJS** | 11 | Framework |
| **Prisma** | 7.7 | ORM |
| **PostgreSQL** | — | Banco de dados |
| **AWS S3** | — | Armazenamento de arquivos |
| **Zod** | 4.3 | Validação de schemas |
| **Passport + JWT** | — | Autenticação (RS256) |
| **bcrypt** | 6 | Hashing de senhas |

### Testes

| Tecnologia | Propósito |
|------------|-----------|
| **Vitest** | Runner de testes |
| **Supertest** | Testes HTTP (E2E) |
| **Faker.js** | Geração de dados fictícios |
| **SWC** | Compilação rápida para testes |

---

## Primeiros passos

### Pré-requisitos

- Node.js 22+
- pnpm 10+
- Docker (PostgreSQL + LocalStack para S3 local)

### Instalação

```bash
pnpm install
```

### Variáveis de ambiente

Copie os arquivos de exemplo:

```bash
cp .env.example .env        # desenvolvimento
cp .env.example .env.test   # testes
```

Variáveis necessárias:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_PRIVATE_KEY` | Chave privada RSA (base64) |
| `JWT_PUBLIC_KEY` | Chave pública RSA (base64) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | Região AWS |
| `AWS_BUCKET_NAME` | Nome do bucket S3 |
| `AWS_ENDPOINT` | Endpoint S3 (ex: `http://localhost:4566` para LocalStack) |
| `PORT` | Porta do servidor |
| `NODE_ENV` | Ambiente (`development` ou `test`) |

### Banco de dados

```bash
docker compose up -d                     # Sobe PostgreSQL + LocalStack
pnpm prisma migrate dev                  # Aplica migrations
```

### Executando

```bash
pnpm start:dev      # Desenvolvimento (watch mode)
pnpm start:prod     # Produção
```

### Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm build` | Compila o projeto |
| `pnpm start:dev` | Inicia em modo desenvolvimento |
| `pnpm format` | Formata código com Prettier |
| `pnpm lint` | Executa ESLint |
| `pnpm test` | Testes unitários |
| `pnpm test:cov` | Testes unitários com cobertura |
| `pnpm test:e2e` | Testes E2E (requer banco) |

---

## API Endpoints

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/accounts` | Cadastro de admin | — |
| `POST` | `/sessions` | Login (retorna JWT) | — |

### Entregadores (admin only)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/delivery-drivers` | Cadastrar entregador |
| `GET` | `/delivery-drivers` | Listar entregadores |
| `GET` | `/delivery-drivers/:id` | Detalhes do entregador |
| `PUT` | `/delivery-drivers/:id` | Atualizar entregador |
| `DELETE` | `/delivery-drivers/:id` | Remover entregador |

### Destinatários (admin only)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/recipients` | Cadastrar destinatário |
| `GET` | `/recipients` | Listar destinatários |
| `GET` | `/recipients/:id` | Detalhes do destinatário |
| `PUT` | `/recipients/:id` | Atualizar destinatário |
| `DELETE` | `/recipients/:id` | Remover destinatário |

### Encomendas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/orders` | Cadastrar encomenda | Admin |
| `GET` | `/orders` | Listar encomendas | Admin |
| `GET` | `/orders/nearby` | Encomendas próximas (10 km) | Driver |
| `GET` | `/orders/driver/:driverId` | Encomendas de um entregador | Admin/Driver |
| `GET` | `/orders/recipient/:recipientId` | Encomendas de um destinatário | Admin |
| `GET` | `/orders/:id` | Detalhes da encomenda | Admin |
| `PUT` | `/orders/:id` | Editar encomenda | Admin |
| `DELETE` | `/orders/:id` | Remover encomenda | Admin |
| `PATCH` | `/orders/:id/awaiting` | Marcar como disponível | Admin |
| `PATCH` | `/orders/:id/pickup` | Retirar encomenda | Admin |
| `POST` | `/orders/:id/deliver` | Entregar (com foto) | Admin |
| `POST` | `/orders/:id/return` | Devolver encomenda | Admin |

### Anexos

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/attachments` | Upload de arquivo | Admin |

---

## Máquina de estados dos pedidos

```
                  +----------+
                  | CREATED  |
                  +----+-----+
                       |
                  PATCH /awaiting
                       |
                  +----+-----+
                  | WAITING  |
                  +----+-----+
                       |
                  PATCH /pickup
                       |
                  +----+--------+
                  | PICKED_UP   |
                  +----+--------+
                     /    \
                    /      \
           POST /deliver   POST /return
                  /            \
                 /              \
     +----------/-+     +-------/----+
     | DELIVERED  |     |  RETURNED  |
     +------------+     +-----+------+
                              |
                         PATCH /awaiting
                              |
                         +----+-----+
                         | WAITING  |
                         +----------+
```

---

## Arquitetura

```
src/
├── core/          ← Framework agnóstico (Entity, ValueObject, Either, DomainEvents)
├── domain/        ← Regras de negócio (DDD)
│   ├── iam/           · Subdomínio de Identidade e Acesso
│   ├── logistics/     · Subdomínio de Logística e Encomendas (core)
│   └── notification/  · Subdomínio de Notificações
└── infra/         ← Infraestrutura (NestJS, Prisma, AWS S3, HTTP)
    ├── auth/          · JWT, guards, RBAC
    ├── cryptography/  · bcrypt, JWT encrypter
    ├── database/      · Prisma repositories + mappers
    ├── env/           · Validação de variáveis de ambiente
    ├── http/          · Controllers, pipes, presenters
    └── storage/       · AWS S3 uploader
```

### Princípios

- **Domain-Driven Design** — 3 bounded contexts (IAM, Logistics, Notification) com entidades, value objects, aggregate roots e domain events
- **Clean Architecture** — Dependências apontam para o centro (domínio não conhece infraestrutura)
- **SOLID** — Interfaces segregadas, injeção de dependência, responsabilidade única
- **Functional Error Handling** — `Either<Error, Success>` em todos os use cases
- **Soft Delete** — Remoção lógica com `deletedAt`

---

## Testes

- **Unitários**: Use cases testados com repositórios in-memory e fakes (`vitest`)
- **E2E**: Controllers testados com Supertest + PostgreSQL isolado (schema UUID por execução)

```bash
pnpm test          # Unitários
pnpm test:cov      # Com cobertura
pnpm test:e2e      # E2E (requer docker compose up)
```

---

## Estrutura de diretórios

```
fast-feet/
├── prisma/                  # Schema e migrations
├── src/
│   ├── core/                # Camada compartilhada
│   │   ├── entities/        #   Entity, AggregateRoot, ValueObject
│   │   ├── errors/          #   Erros base
│   │   ├── events/          #   DomainEvents, DomainEvent, EventHandler
│   │   ├── repositories/    #   PaginationParams
│   │   ├── types/           #   Optional<T>
│   │   ├── either.ts        #   Either monad
│   │   └── either.spec.ts
│   ├── domain/
│   │   ├── iam/
│   │   │   ├── application/ #   Use cases, interfaces
│   │   │   └── enterprise/  #   Entities, Value Objects, Errors
│   │   ├── logistics/
│   │   │   ├── application/ #   Use cases, interfaces
│   │   │   └── enterprise/  #   Entities, Events, Value Objects
│   │   └── notification/
│   │       ├── application/ #   Use cases, subscribers
│   │       └── enterprise/  #   Notification entity
│   └── infra/
│       ├── auth/            # JWT strategy, guards, decorators
│       ├── cryptography/    # bcrypt hasher, JWT encrypter
│       ├── database/        # Prisma service, mappers, repositories
│       ├── env/             # Zod env validation
│       ├── http/            # Controllers, pipes, presenters
│       └── storage/         # AWS S3 uploader
└── test/                    # E2E setup, factories, fakes
    ├── cryptography/        # Fake hasher, fake encrypter
    ├── factories/           # makeUser, makeOrder, makeRecipient
    ├── repositories/        # In-memory repositories
    └── utils/               # waitFor, getDistanceBetweenCoordinates
```

---

## Licença

MIT
