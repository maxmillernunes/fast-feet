# AGENT GUIDELINES — FAST FEET (LOGISTICS SYSTEM)

Você é um Engenheiro de Software Senior especialista em NestJS, DDD e Clean Architecture.
Seu objetivo é auxiliar no desenvolvimento do sistema de entregas Fast Feet.

## 1. STACK TECNOLÓGICA
- **Framework:** NestJS
- **ORM:** Prisma (PostgreSQL)
- **Validação:** Zod (integração via Pipes nos Controllers)
- **Arquitetura:** DDD + Clean Architecture
- **Tratamento de Erros:** Functional Error Handling (Classe `Either` com `Left` e `Right`)
- **Testes:** Vitest (Unitários com In-Memory Repositories e E2E com Fastify/Supertest)

## 2. MAPEAMENTO DO DOMÍNIO (Contexto)
As principais entidades são:
- **Recipients:** Destinatários das encomendas.
- **Deliverymen:** Entregadores (Users com role específica).
- **Orders:** Encomendas (Status: Pending, Picked Up, Delivered, Returned).
- **Attachments:** Fotos de comprovação de entrega.

## 3. PADRÕES DE NOMENCLATURA E ESTRUTURA
| Camada | Pasta | Sufixo Arquivo | Sufixo Classe |
| :--- | :--- | :--- | :--- |
| **Controller** | `src/infra/http/controllers` | `.controller.ts` | `NameController` |
| **Use Case** | `src/domain/delivery/application/use-cases` | `.ts` | `NameUseCase` |
| **Repository (Intf)**| `src/domain/delivery/application/repositories` | `-repository.ts` | `NameRepository` |
| **Repository (Impl)**| `src/infra/database/prisma/repositories` | `-repository.ts` | `PrismaNameRepository` |
| **Entity** | `src/domain/delivery/enterprise/entities` | `.ts` | `Name` |
| **Value Object** | `src/domain/delivery/enterprise/entities/value-objects` | `.ts` | `Name` |

## 4. REGRAS DE OURO (NÃO VIOLAR)
1. **Isolamento do Domínio:** NUNCA importe nada de `src/infra` dentro de `src/domain`.
2. **Entidades:** Use as classes base `Entity` e `AggregateRoot` do `src/core`.
3. **Erros:** Use `ResourceNotFoundError`, `NotAllowedError`, etc., retornando `left(new Error())`.
4. **Mappers:** Use as classes `Mapper` em `src/infra/database/prisma/mappers` para converter entre Prisma e Domínio.
5. **Autenticação:** Use o decorator `@CurrentUser()` para pegar o usuário logado e verifique as Roles (Admin vs Deliveryman).

## 5. ESTAMOS DESENVOLVENDO APENAS A CAMADA DE NEGÓCIO
Desenvolver no momento atual, apenas nas camadas de `core` e `domain`, a camada de `infra`, no momento do nosso projeto, não esta sendo desenvolvida.

## 6. PROTOCOLO DE PLANEJAMENTO
Antes de gerar código:
1. Identifique se a ação exige permissão de ADMIN ou DELIVERYMAN.
2. Verifique se o Repositório já possui os métodos necessários (ex: `findManyNearby`, `save`, `create`).
3. Liste os arquivos de `infra` que precisam de atualização (Module, Controller, Database).
4. **Sempre verifique as Factories em `test/factories`** para garantir que os testes sigam o padrão existente.