# DATABASE

Prisma ORM, Repositories e Mappers.

## O QUE CONTÉM

```
database/
├── database.module.ts     # Module de configuração
└── prisma/
    ├── prisma.service.ts # PrismaClient wrapper
    ├── repositories/     # Implementações de repositories
    └── mappers/          # Conversão Domain ↔ Prisma
```

---

## PRISMA SERVICE

Wrapper do PrismaClient com injeção de dependência.

```typescript
// src/infra/database/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

### Uso em Repositories

```typescript
@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })
    return user ? PrismaUserMapper.toDomain(user) : null
  }
}
```

---

## MAPPERS

Converte entre formato Prisma (banco) e formato Domain.

### Estrutura

```typescript
// src/infra/database/prisma/mappers/prisma-user-mapper.ts
import { User } from '@/domain/iam/enterprise/entities/user'

export class PrismaUserMapper {
  static toDomain(raw: any): User {
    return User.create({
      name: raw.name,
      email: raw.email,
      document: raw.document,
      password: raw.password,
      role: raw.role,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, new UniqueEntityId(raw.id))
  }

  static toPrisma(user: User): any {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      document: user.document.value,
      password: user.password,
      role: user.role.value,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }
  }
}
```

### Regras

1. **toDomain**: Converte dados do banco para entidade de domínio
2. **toPrisma**: Converte entidade de domínio para formato do banco
3. Use UniqueEntityId para criar entidades com ID existente

---

## REPOSITORY IMPLEMENTATION

### Padrão

```typescript
@Injectable()
export class Prisma[Entity]Repository implements [Entity]Repository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<[Entity] | null> {
    const [entity] = await this.prisma.[table].findUnique({
      where: { id },
    })

    return [entity] ? Prisma[Entity]Mapper.toDomain([entity]) : null
  }

  async create([entity]: [Entity]): Promise<void> {
    const data = Prisma[Entity]Mapper.toPrisma([entity])
    await this.prisma.[table].create({ data })
  }

  async save([entity]: [Entity]): Promise<void> {
    const data = Prisma[Entity]Mapper.toPrisma([entity])
    await this.prisma.[table].update({
      where: { id: data.id },
      data,
    })
  }

  async delete([entity]: [Entity]): Promise<void> {
    await this.prisma.[table].delete({
      where: { id: [entity].id.toString() },
    })
  }

  // Soft delete
  async softDelete([entity]: [Entity]): Promise<void> {
    await this.prisma.[table].update({
      where: { id: [entity].id.toString() },
      data: { deletedAt: new Date() },
    })
  }
}
```

### Soft Delete

Para implementar soft delete, o repository deve filtrar registros com `deletedAt: null`:

```typescript
async findById(id: string): Promise<Entity | null> {
  const entity = await this.prisma.user.findUnique({
    where: { id, deletedAt: null },  // Filtrar apenas ativos
  })
  // ...
}
```

---

## DATABASE MODULE

Registro dos repositories no módulo:

```typescript
// src/infra/database/database.module.ts
@Module({
  providers: [
    PrismaService,
    PrismaUsersRepository,
    PrismaOrdersRepository,
    PrismaRecipientsRepository,
    PrismaAttachmentsRepository,
  ],
  exports: [
    PrismaUsersRepository,
    PrismaOrdersRepository,
    PrismaRecipientsRepository,
    PrismaAttachmentsRepository,
  ],
})
export class DatabaseModule {}
```

---

## SCHEMA PRISMA

O schema define as tabelas do banco. Ver: `prisma/schema.prisma`

### Tabelas principais:

| Tabela       | Descrição              |
| ------------ | ---------------------- |
| `User`       | Usuários (admin/driver)|
| `Order`      | Encomendas             |
| `Recipient`  | Destinatários          |
| `Attachment` | Anexos (fotos entrega) |
| `Notification`| Notificações           |

### Campos padrão em todas entidades:

```prisma
model User {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // ... campos específicos
}
```

---

## REGRA IMPORTANTE

O Prisma **NUNCA** é importado na camada de domínio.

```
domain/application/use-cases/ → importa UsersRepository (interface)
infra/database/                → implementa UsersRepository (Prisma)
```