# Design: Infraestrutura do Domínio Logistics

**Data:** 2026-05-08
**Status:** Aprovado

---

## Visão Geral

Implementar a infraestrutura completa do domínio LOGISTICS seguindo o padrão estabelecido pelo domínio IAM já implementado. Isso inclui: schema Prisma, mappers, repositories, controllers, presenters, factories e testes e2e.

---

## Arquitetura

### Stack Tecnológica

- **Framework:** NestJS
- **ORM:** Prisma
- **Testes:** Vitest + Supertest
- **Autenticação:** JWT (já implementado)

### Estrutura de Diretórios

```
src/
├── domain/logistics/
│   ├── enterprise/entities/
│   │   ├── order.ts
│   │   ├── recipient.ts
│   │   ├── attachment.ts
│   │   └── ...
│   └── application/
│       ├── use-cases/
│       │   └── *.ts (já implementado)
│       └── repositories/
│           └── interfaces/*.ts (já implementado)
│
└── infra/
    ├── database/
    │   └── prisma/
    │       ├── client/
    │       │   └── client.ts (gerado pelo Prisma)
    │       ├── mappers/
    │       │   ├── prisma-order-mapper.ts
    │       │   ├── prisma-recipient-mapper.ts
    │       │   └── prisma-order-attachment-mapper.ts
    │       └── repositories/
    │           ├── prisma-orders-repository.ts
    │           ├── prisma-recipients-repository.ts
    │           └── prisma-order-attachments-repository.ts
    ├── http/
    │   ├── presenters/
    │   │   ├── order-presenter.ts
    │   │   ├── order-with-recipient-presenter.ts
    │   │   └── recipient-presenter.ts
    │   └── controllers/
    │       ├── register-order.controller.ts
    │       ├── delete-order.controller.ts
    │       ├── edit-order.controller.ts
    │       ├── mark-order-as-awaiting.controller.ts
    │       ├── pickup-order.controller.ts
    │       ├── delivery-order.controller.ts
    │       ├── return-order.controller.ts
    │       ├── fetch-recent-orders.controller.ts
    │       ├── fetch-nearby-orders.controller.ts
    │       ├── fetch-driver-orders.controller.ts
    │       ├── fetch-orders-by-recipient.controller.ts
    │       ├── get-order-details.controller.ts
    │       ├── register-recipient.controller.ts
    │       ├── fetch-recipients.controller.ts
    │       ├── get-recipient.controller.ts
    │       ├── edit-recipient.controller.ts
    │       └── delete-recipient.controller.ts
    └── app.module.ts

test/
├── factories/
│   ├── make-recipient.ts
│   ├── make-order.ts
│   ├── recipient-factory.ts
│   └── order-factory.ts
├── e2e/ (dentro de controllers/)
│   └── *-controller.e2e-spec.ts
└── setup-e2e.ts (já existente)
```

---

## Componentes

### 1. Schema Prisma

Expansão do `prisma/schema.prisma` com relations:

```prisma
enum OrderStatus {
  CREATED
  WAITING
  PICKED_UP
  DELIVERED
  RETURNED
}

model Recipient {
  id            String   @id @default(uuid())
  name          String
  document      String   @unique
  country       String
  zipCode       String
  state         String
  city          String
  street        String
  neighborhood  String
  complement    String?
  latitude      Float
  longitude     Float
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime? @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")
  orders        Order[]

  @@map("recipients")
}

model Order {
  id               String        @id @default(uuid())
  recipientId      String
  deliveryDriveId  String?
  status           OrderStatus   @default(CREATED)
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime?     @updatedAt @map("updated_at")
  pickedAt         DateTime?     @map("picked_at")
  deliveredAt      DateTime?     @map("delivered_at")
  deletedAt        DateTime?     @map("deleted_at")

  recipient        Recipient     @relation(fields: [recipientId], references: [id])
  attachments      OrderAttachment[]

  @@map("orders")
}

model OrderAttachment {
  id          String @id @default(uuid())
  orderId     String
  attachmentId String

  order       Order      @relation(fields: [orderId], references: [id])
  attachment  Attachment @relation(fields: [attachmentId], references: [id])

  @@map("order_attachments")
}
```

### 2. Mappers

Cada mapper segue o padrão com tipos explícitos do Prisma Client:

**`prisma-order-mapper.ts`**
```typescript
import { Prisma, Order as PrismaOrder } from '../client/client'

export class PrismaOrderMapper {
  static toDomain(raw: PrismaOrder): Order { ... }
  static toPrisma(order: Order): Prisma.OrderUncheckedCreateInput { ... }
}
```

**`prisma-recipient-mapper.ts`**
```typescript
import { Prisma, Recipient as PrismaRecipient } from '../client/client'

export class PrismaRecipientMapper {
  static toDomain(raw: PrismaRecipient): Recipient { ... }
  static toPrisma(recipient: Recipient): Prisma.RecipientUncheckedCreateInput { ... }
}
```

**`prisma-order-attachment-mapper.ts`**
```typescript
import { Prisma, OrderAttachment as PrismaOrderAttachment } from '../client/client'

export class PrismaOrderAttachmentMapper {
  static toDomain(raw: PrismaOrderAttachment): OrderAttachment { ... }
  static toPrisma(orderAttachment: OrderAttachment): Prisma.OrderAttachmentUncheckedCreateInput { ... }
}
```

### 3. Repositories

Implementação Prisma seguindo interface:

```typescript
@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> { ... }
  async findByIdWithRecipient(id: string): Promise<OrderWithRecipient | null> { ... }
  async findManyRecent(params: PaginationParams): Promise<Order[]> { ... }
  async findManyNearby(params: FindManyNearbyOrdersParams): Promise<Order[]> { ... }
  async findManyByDriver(driverId: string, status: StatusOptions[], params: PaginationParams): Promise<Order[]> { ... }
  async findOrdersByRecipientId(recipientId: string, params: PaginationParams): Promise<Order[]> { ... }
  async create(order: Order): Promise<void> { ... }
  async save(order: Order): Promise<void> { ... }
  async delete(order: Order): Promise<void> { ... }
}
```

Similar para:
- `PrismaRecipientsRepository`
- `PrismaOrderAttachmentsRepository`

### 4. Controllers

Cada use case tem seu próprio controller:

```typescript
@Controller('/orders')
export class RegisterOrderController {
  constructor(private registerOrder: RegisterOrderUseCase) {}

  @Post()
  async handle(@Body() body) {
    const result = await this.registerOrder.execute({ ... })

    if (result.isLeft()) {
      const error = result.value
      throw new BadRequestException(error.message)
    }

    return result.value
  }
}
```

**Lista completa de controllers:**

| Controller | Método | Endpoint |
|------------|--------|----------|
| RegisterOrderController | POST | /orders |
| DeleteOrderController | DELETE | /orders/:id |
| EditOrderController | PATCH | /orders/:id |
| MarkOrderAsAwaitingController | POST | /orders/:id/awaiting |
| PickupOrderController | POST | /orders/:id/pickup |
| DeliveryOrderController | POST | /orders/:id/deliver |
| ReturnOrderController | POST | /orders/:id/return |
| FetchRecentOrdersController | GET | /orders |
| FetchNearbyOrdersController | GET | /orders/nearby |
| FetchDriverOrdersController | GET | /orders/driver |
| FetchOrdersByRecipientController | GET | /orders/recipient/:id |
| GetOrderDetailsController | GET | /orders/:id |

| Controller | Método | Endpoint |
|------------|--------|----------|
| RegisterRecipientController | POST | /recipients |
| FetchRecipientsController | GET | /recipients |
| GetRecipientController | GET | /recipients/:id |
| EditRecipientController | PATCH | /recipients/:id |
| DeleteRecipientController | DELETE | /recipients/:id |

### 5. Presenters

Um arquivo por presenter:

**`order-presenter.ts`**
```typescript
export class OrderPresenter {
  static toHTTP(order: Order) {
    return {
      id: order.id.toString(),
      status: order.status.getContent(),
      recipientId: order.recipientId.toString(),
      deliveryDriveId: order.deliveryDriveId?.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedAt: order.pickedAt,
      deliveredAt: order.deliveredAt,
    }
  }
}
```

**`order-with-recipient-presenter.ts`**
```typescript
export class OrderWithRecipientPresenter {
  static toHTTP(orderWithRecipient: OrderWithRecipient) {
    return {
      id: orderWithRecipient.id.toString(),
      status: orderWithRecipient.status.getContent(),
      recipient: {
        id: orderWithRecipient.recipient.id.toString(),
        name: orderWithRecipient.recipient.name,
        zipCode: orderWithRecipient.recipient.zipCode,
        state: orderWithRecipient.recipient.state,
        city: orderWithRecipient.recipient.city,
        street: orderWithRecipient.recipient.street,
        neighborhood: orderWithRecipient.recipient.neighborhood,
        complement: orderWithRecipient.recipient.complement,
      },
      createdAt: orderWithRecipient.createdAt,
      pickedAt: orderWithRecipient.pickedAt,
      deliveredAt: orderWithRecipient.deliveredAt,
    }
  }
}
```

**`recipient-presenter.ts`**
```typescript
export class RecipientPresenter {
  static toHTTP(recipient: Recipient) {
    return {
      id: recipient.id.toString(),
      name: recipient.name,
      document: recipient.document.getValue(),
      country: recipient.country,
      zipCode: recipient.zipCode,
      state: recipient.state,
      city: recipient.city,
      street: recipient.street,
      neighborhood: recipient.neighborhood,
      complement: recipient.complement,
      latitude: recipient.latitude,
      longitude: recipient.longitude,
      createdAt: recipient.createdAt,
      updatedAt: recipient.updatedAt,
    }
  }
}
```

### 6. Factories

Factories seguem padrão do `UserFactory`:

**`recipient-factory.ts`**
```typescript
@Injectable()
export class RecipientFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaRecipient(data: Partial<RecipientProps> = {}): Promise<Recipient> {
    const recipient = makeRecipient(data)
    await this.prisma.recipient.create({
      data: PrismaRecipientMapper.toPrisma(recipient),
    })
    return recipient
  }
}
```

**`order-factory.ts`**
```typescript
@Injectable()
export class OrderFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaOrder(data: Partial<OrderProps> = {}): Promise<Order> {
    const order = makeOrder(data)
    await this.prisma.order.create({
      data: PrismaOrderMapper.toPrisma(order),
    })
    return order
  }
}
```

### 7. Testes E2E

Padrão seguido dos controllers IAM:

```typescript
describe('Register Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let adminFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    adminFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[POST] /orders', async () => {
    const admin = await adminFactory.makePrismaUser({ role: 'ADMIN' })
    const recipient = await recipientFactory.makePrismaRecipient()
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipientId: recipient.id.toString() })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      orderId: expect.any(String),
    })
  })
})
```

**Lista de arquivos de teste:**

| Teste | Arquivo |
|-------|---------|
| Register Order | `register-order.controller.e2e-spec.ts` |
| Delete Order | `delete-order.controller.e2e-spec.ts` |
| Edit Order | `edit-order.controller.e2e-spec.ts` |
| Mark Order As Awaiting | `mark-order-as-awaiting.controller.e2e-spec.ts` |
| Pickup Order | `pickup-order.controller.e2e-spec.ts` |
| Delivery Order | `delivery-order.controller.e2e-spec.ts` |
| Return Order | `return-order.controller.e2e-spec.ts` |
| Fetch Recent Orders | `fetch-recent-orders.controller.e2e-spec.ts` |
| Fetch Nearby Orders | `fetch-nearby-orders.controller.e2e-spec.ts` |
| Fetch Driver Orders | `fetch-driver-orders.controller.e2e-spec.ts` |
| Fetch Orders By Recipient | `fetch-orders-by-recipient.controller.e2e-spec.ts` |
| Get Order Details | `get-order-details.controller.e2e-spec.ts` |
| Register Recipient | `register-recipient.controller.e2e-spec.ts` |
| Fetch Recipients | `fetch-recipients.controller.e2e-spec.ts` |
| Get Recipient | `get-recipient.controller.e2e-spec.ts` |
| Edit Recipient | `edit-recipient.controller.e2e-spec.ts` |
| Delete Recipient | `delete-recipient.controller.e2e-spec.ts` |

### 8. DatabaseModule

Expansão do `src/infra/database/database.module.ts`:

```typescript
@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,

    // IAM Repositories
    { provide: UsersRepository, useClass: PrismaUsersRepository },

    // Logistics Repositories
    { provide: AttachmentsRepository, useClass: PrismaAttachmentsRepository },
    { provide: OrdersRepository, useClass: PrismaOrdersRepository },
    { provide: RecipientsRepository, useClass: PrismaRecipientsRepository },
    { provide: OrderAttachmentsRepository, useClass: PrismaOrderAttachmentsRepository },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    AttachmentsRepository,
    OrdersRepository,
    RecipientsRepository,
    OrderAttachmentsRepository,
  ],
})
export class DatabaseModule {}
```

---

## Resumo de Arquivos a Criar

| Categoria | Quantidade | Arquivos |
|-----------|-------------|----------|
| Schema Prisma | 1 | `prisma/schema.prisma` (atualização) |
| Mappers | 3 | `prisma/mappers/prisma-{order,recipient,order-attachment}-mapper.ts` |
| Repositories | 3 | `prisma/repositories/prisma-{orders,recipients,order-attachments}-repository.ts` |
| Controllers | 17 | `http/controllers/*-controller.ts` |
| Presenters | 3 | `http/presenters/*-presenter.ts` |
| Factories | 2 | `test/factories/{recipient,order}-factory.ts` |
| E2E Tests | 17 | `http/controllers/*-controller.e2e-spec.ts` |

**Total: ~43 arquivos** (além da atualização do schema e database module)

---

## Ordem de Implementação Sugerida

1. **Schema Prisma** - Atualizar `prisma/schema.prisma`
2. **Mappers** - Criar mappers para Order, Recipient, OrderAttachment
3. **Repositories** - Implementar Prisma repositories
4. **DatabaseModule** - Registrar providers
5. **Presenters** - Criar presenters
6. **Controllers** - Implementar controllers
7. **Factories** - Criar factories
8. **E2E Tests** - Escrever testes

---

## Notas

- Permissões (Admin/Driver) serão configuradas nos controllers pelo usuário
- Todos os controllers seguem padrão de validação com Zod
- Mappers usam tipos explícitos do Prisma Client gerado