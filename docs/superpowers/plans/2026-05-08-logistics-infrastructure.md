# Logistics Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Prisma/HTTP/E2E infrastructure for the LOGISTICS domain (Orders, Recipients, Attachments).

**Architecture:** Expand the Prisma schema with `OrderStatus` enum and models (`Recipient`, `Order`, `OrderAttachment`). Implement mappers following the typed `PrismaUserMapper` pattern, repositories with `@Injectable()` Prisma implementation, presenters with `toHTTP` static methods, and controllers following the NestJS pattern established in the IAM domain. E2E tests use `supertest` with the existing `UserFactory` pattern.

**Tech Stack:** NestJS, Prisma, Vitest, Supertest, Zod

---

## File Structure

```
Modified:
  prisma/schema.prisma
  src/infra/database/database.module.ts

Created:
  src/infra/database/prisma/mappers/prisma-order-mapper.ts
  src/infra/database/prisma/mappers/prisma-recipient-mapper.ts
  src/infra/database/prisma/mappers/prisma-order-attachment-mapper.ts
  src/infra/database/prisma/repositories/prisma-orders-repository.ts
  src/infra/database/prisma/repositories/prisma-recipients-repository.ts
  src/infra/database/prisma/repositories/prisma-order-attachments-repository.ts
  src/infra/http/presenters/order-presenter.ts
  src/infra/http/presenters/order-with-recipient-presenter.ts
  src/infra/http/presenters/recipient-presenter.ts
  test/factories/recipient-factory.ts
  test/factories/order-factory.ts
  src/infra/http/controllers/register-order.controller.ts
  src/infra/http/controllers/delete-order.controller.ts
  src/infra/http/controllers/edit-order.controller.ts
  src/infra/http/controllers/mark-order-as-awaiting.controller.ts
  src/infra/http/controllers/pickup-order.controller.ts
  src/infra/http/controllers/delivery-order.controller.ts
  src/infra/http/controllers/return-order.controller.ts
  src/infra/http/controllers/fetch-recent-orders.controller.ts
  src/infra/http/controllers/fetch-nearby-orders.controller.ts
  src/infra/http/controllers/fetch-driver-orders.controller.ts
  src/infra/http/controllers/fetch-orders-by-recipient.controller.ts
  src/infra/http/controllers/get-order-details.controller.ts
  src/infra/http/controllers/register-recipient.controller.ts
  src/infra/http/controllers/fetch-recipients.controller.ts
  src/infra/http/controllers/get-recipient.controller.ts
  src/infra/http/controllers/edit-recipient.controller.ts
  src/infra/http/controllers/delete-recipient.controller.ts
  src/infra/http/controllers/register-order.controller.e2e-spec.ts
  src/infra/http/controllers/delete-order.controller.e2e-spec.ts
  src/infra/http/controllers/edit-order.controller.e2e-spec.ts
  src/infra/http/controllers/mark-order-as-awaiting.controller.e2e-spec.ts
  src/infra/http/controllers/pickup-order.controller.e2e-spec.ts
  src/infra/http/controllers/delivery-order.controller.e2e-spec.ts
  src/infra/http/controllers/return-order.controller.e2e-spec.ts
  src/infra/http/controllers/fetch-recent-orders.controller.e2e-spec.ts
  src/infra/http/controllers/fetch-nearby-orders.controller.e2e-spec.ts
  src/infra/http/controllers/fetch-driver-orders.controller.e2e-spec.ts
  src/infra/http/controllers/fetch-orders-by-recipient.controller.e2e-spec.ts
  src/infra/http/controllers/get-order-details.controller.e2e-spec.ts
  src/infra/http/controllers/register-recipient.controller.e2e-spec.ts
  src/infra/http/controllers/fetch-recipients.controller.e2e-spec.ts
  src/infra/http/controllers/get-recipient.controller.e2e-spec.ts
  src/infra/http/controllers/edit-recipient.controller.e2e-spec.ts
  src/infra/http/controllers/delete-recipient.controller.e2e-spec.ts
```

---

### Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add OrderStatus enum, Recipient, Order, and OrderAttachment models**

Open `prisma/schema.prisma` and add after the `Attachment` model:

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

  recipient        Recipient        @relation(fields: [recipientId], references: [id])
  attachments      OrderAttachment[]

  @@map("orders")
}

model OrderAttachment {
  id           String @id @default(uuid())
  orderId      String
  attachmentId String

  order      Order      @relation(fields: [orderId], references: [id])
  attachment Attachment @relation(fields: [attachmentId], references: [id])

  @@map("order_attachments")
}
```

- [ ] **Generate Prisma client**

```bash
npx prisma generate
```

Expected: Client regenerated with `OrderStatus` enum and `Recipient`, `Order`, `OrderAttachment` models.

---

### Task 2: Create Prisma Mappers

**Files:**
- Create: `src/infra/database/prisma/mappers/prisma-order-mapper.ts`
- Create: `src/infra/database/prisma/mappers/prisma-recipient-mapper.ts`
- Create: `src/infra/database/prisma/mappers/prisma-order-attachment-mapper.ts`

- [ ] **Create PrismaRecipientMapper**

```typescript
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Recipient } from '@/domain/logistics/enterprise/entities/recipient'
import { Document } from '@/domain/logistics/enterprise/entities/values-objects/document'
import {
  Prisma,
  Recipient as PrismaRecipient,
} from '../client/client'

export class PrismaRecipientMapper {
  static toDomain(raw: PrismaRecipient): Recipient {
    const documentResult = Document.create(raw.document)

    if (documentResult.isLeft()) {
      throw new Error('Invalid document in database')
    }

    return Recipient.create(
      {
        name: raw.name,
        document: documentResult.value,
        country: raw.country,
        zipCode: raw.zipCode,
        state: raw.state,
        city: raw.city,
        street: raw.street,
        neighborhood: raw.neighborhood,
        complement: raw.complement ?? undefined,
        latitude: raw.latitude,
        longitude: raw.longitude,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt ?? undefined,
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(
    recipient: Recipient,
  ): Prisma.RecipientUncheckedCreateInput {
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

- [ ] **Create PrismaOrderMapper**

```typescript
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Order } from '@/domain/logistics/enterprise/entities/order'
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'
import {
  Prisma,
  Order as PrismaOrder,
  Recipient as PrismaRecipient,
  OrderStatus as PrismaOrderStatus,
} from '../client/client'

export class PrismaOrderMapper {
  static toDomain(raw: PrismaOrder): Order {
    return Order.create(
      {
        recipientId: new UniqueEntityId(raw.recipientId),
        deliveryDriveId: raw.deliveryDriveId
          ? new UniqueEntityId(raw.deliveryDriveId)
          : undefined,
        status: OrderStatus.create(raw.status as OrderStatus['value']),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt ?? undefined,
        pickedAt: raw.pickedAt ?? undefined,
        deliveredAt: raw.deliveredAt ?? undefined,
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toDomainWithRecipient(
    raw: PrismaOrder & { recipient?: PrismaRecipient },
  ): OrderWithRecipient {
    if (!raw.recipient) {
      throw new Error('Recipient not loaded for order')
    }

    return OrderWithRecipient.create({
      id: new UniqueEntityId(raw.id),
      deliveryDriveId: raw.deliveryDriveId
        ? new UniqueEntityId(raw.deliveryDriveId)
        : undefined,
      status: OrderStatus.create(raw.status as OrderStatus['value']),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
      pickedAt: raw.pickedAt ?? undefined,
      deliveredAt: raw.deliveredAt ?? undefined,
      recipient: {
        id: new UniqueEntityId(raw.recipient.id),
        name: raw.recipient.name,
        zipCode: raw.recipient.zipCode,
        state: raw.recipient.state,
        city: raw.recipient.city,
        street: raw.recipient.street,
        neighborhood: raw.recipient.neighborhood,
        complement: raw.recipient.complement ?? undefined,
      },
    })
  }

  static toPrisma(order: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: order.id.toString(),
      recipientId: order.recipientId.toString(),
      deliveryDriveId: order.deliveryDriveId?.toString(),
      status: order.status.getContent() as PrismaOrderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedAt: order.pickedAt,
      deliveredAt: order.deliveredAt,
    }
  }
}
```

- [ ] **Create PrismaOrderAttachmentMapper**

```typescript
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'
import {
  Prisma,
  OrderAttachment as PrismaOrderAttachment,
} from '../client/client'

export class PrismaOrderAttachmentMapper {
  static toDomain(
    raw: PrismaOrderAttachment,
  ): OrderAttachment {
    return OrderAttachment.create(
      {
        orderId: new UniqueEntityId(raw.orderId),
        attachmentId: new UniqueEntityId(raw.attachmentId),
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(
    orderAttachment: OrderAttachment,
  ): Prisma.OrderAttachmentUncheckedCreateInput {
    return {
      id: orderAttachment.id.toString(),
      orderId: orderAttachment.orderId.toString(),
      attachmentId: orderAttachment.attachmentId.toString(),
    }
  }
}
```

---

### Task 3: Create Prisma Repositories

**Files:**
- Create: `src/infra/database/prisma/repositories/prisma-orders-repository.ts`
- Create: `src/infra/database/prisma/repositories/prisma-recipients-repository.ts`
- Create: `src/infra/database/prisma/repositories/prisma-order-attachments-repository.ts`

- [ ] **Create PrismaOrdersRepository**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { OrdersRepository } from '@/domain/logistics/application/repositories/orders-repository'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import type { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'
import type { PaginationParams } from '@/core/repositories /pagination-params'
import type {
  FindManyNearbyOrdersParams,
} from '@/domain/logistics/application/repositories/orders-repository'
import type { StatusOptions } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { PrismaOrderMapper } from '../mappers/prisma-order-mapper'
import { DomainEvents } from '@/core/events/domain-events'

@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return null
    }

    return PrismaOrderMapper.toDomain(order)
  }

  async findByIdWithRecipient(id: string): Promise<OrderWithRecipient | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { recipient: true },
    })

    if (!order) {
      return null
    }

    return PrismaOrderMapper.toDomainWithRecipient(order)
  }

  async findManyRecent({ page, perPage }: PaginationParams): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return orders.map(PrismaOrderMapper.toDomain)
  }

  async findManyNearby({
    latitude,
    longitude,
  }: FindManyNearbyOrdersParams): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['WAITING', 'CREATED'] },
        recipient: {
          latitude: { gte: latitude - 0.09, lte: latitude + 0.09 },
          longitude: { gte: longitude - 0.09, lte: longitude + 0.09 },
        },
      },
      include: { recipient: true },
    })

    // Filter by actual distance (Haversine)
    const filteredOrders = orders.filter((order) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        order.recipient.latitude,
        order.recipient.longitude,
      )

      return distance < 10 // 10km
    })

    return filteredOrders.map(PrismaOrderMapper.toDomain)
  }

  async findManyByDriver(
    driverId: string,
    status: StatusOptions[],
    { page, perPage }: PaginationParams,
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        deliveryDriveId: driverId,
        status: { in: status },
      },
      orderBy: { pickedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return orders.map(PrismaOrderMapper.toDomain)
  }

  async findOrdersByRecipientId(
    recipientId: string,
    { page, perPage }: PaginationParams,
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return orders.map(PrismaOrderMapper.toDomain)
  }

  async create(order: Order): Promise<void> {
    const data = PrismaOrderMapper.toPrisma(order)

    await this.prisma.order.create({ data })

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async save(order: Order): Promise<void> {
    const data = PrismaOrderMapper.toPrisma(order)

    await this.prisma.order.update({
      where: { id: data.id },
      data,
    })

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async delete(order: Order): Promise<void> {
    await this.prisma.order.delete({
      where: { id: order.id.toString() },
    })
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180
  }
}
```

- [ ] **Create PrismaRecipientsRepository**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import type { Recipient } from '@/domain/logistics/enterprise/entities/recipient'
import type { PaginationParams } from '@/core/repositories /pagination-params'
import { PrismaRecipientMapper } from '../mappers/prisma-recipient-mapper'

@Injectable()
export class PrismaRecipientsRepository implements RecipientsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findUnique({
      where: { id },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async findByDocument(document: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findUnique({
      where: { document },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async findMany({ page, perPage }: PaginationParams): Promise<Recipient[]> {
    const recipients = await this.prisma.recipient.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return recipients.map(PrismaRecipientMapper.toDomain)
  }

  async create(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.create({ data })
  }

  async save(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.update({
      where: { id: data.id },
      data,
    })
  }

  async delete(recipient: Recipient): Promise<void> {
    await this.prisma.recipient.delete({
      where: { id: recipient.id.toString() },
    })
  }
}
```

- [ ] **Create PrismaOrderAttachmentsRepository**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { OrderAttachmentsRepository } from '@/domain/logistics/application/repositories/order-attachments-repository'
import type { OrderAttachment } from '@/domain/logistics/enterprise/entities/order-attachment'
import { PrismaOrderAttachmentMapper } from '../mappers/prisma-order-attachment-mapper'

@Injectable()
export class PrismaOrderAttachmentsRepository
  implements OrderAttachmentsRepository
{
  constructor(private prisma: PrismaService) {}

  async createMany(attachments: OrderAttachment[]): Promise<void> {
    if (attachments.length === 0) return

    const data = attachments.map(PrismaOrderAttachmentMapper.toPrisma)

    await this.prisma.orderAttachment.createMany({ data })
  }

  async deleteMany(attachments: OrderAttachment[]): Promise<void> {
    if (attachments.length === 0) return

    const ids = attachments.map((attachment) => attachment.id.toString())

    await this.prisma.orderAttachment.deleteMany({
      where: { id: { in: ids } },
    })
  }

  async findManyByOrderId(orderId: string): Promise<OrderAttachment[]> {
    const orderAttachments = await this.prisma.orderAttachment.findMany({
      where: { orderId },
    })

    return orderAttachments.map(PrismaOrderAttachmentMapper.toDomain)
  }

  async deleteManyByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderAttachment.deleteMany({
      where: { orderId },
    })
  }
}
```

---

### Task 4: Update DatabaseModule

**Files:**
- Modify: `src/infra/database/database.module.ts`

- [ ] **Add new repository providers and exports**

```typescript
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { EnvModule } from '../env/env.module'
import { UsersRepository } from '@/domain/iam/application/repositories/users-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { AttachmentsRepository } from '@/domain/logistics/application/repositories/attachments-repository'
import { PrismaAttachmentsRepository } from './prisma/repositories/prisma-attachments-repository'
import { OrdersRepository } from '@/domain/logistics/application/repositories/orders-repository'
import { PrismaOrdersRepository } from './prisma/repositories/prisma-orders-repository'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { PrismaRecipientsRepository } from './prisma/repositories/prisma-recipients-repository'
import { OrderAttachmentsRepository } from '@/domain/logistics/application/repositories/order-attachments-repository'
import { PrismaOrderAttachmentsRepository } from './prisma/repositories/prisma-order-attachments-repository'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,

    // IAM Repositories
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },

    // Logistics Repositories
    {
      provide: AttachmentsRepository,
      useClass: PrismaAttachmentsRepository,
    },
    {
      provide: OrdersRepository,
      useClass: PrismaOrdersRepository,
    },
    {
      provide: RecipientsRepository,
      useClass: PrismaRecipientsRepository,
    },
    {
      provide: OrderAttachmentsRepository,
      useClass: PrismaOrderAttachmentsRepository,
    },
  ],
  exports: [
    PrismaService,

    // IAM Repositories
    UsersRepository,

    // Logistics Repositories
    AttachmentsRepository,
    OrdersRepository,
    RecipientsRepository,
    OrderAttachmentsRepository,
  ],
})
export class DatabaseModule {}
```

---

### Task 5: Create Presenters

**Files:**
- Create: `src/infra/http/presenters/order-presenter.ts`
- Create: `src/infra/http/presenters/order-with-recipient-presenter.ts`
- Create: `src/infra/http/presenters/recipient-presenter.ts`

- [ ] **Create OrderPresenter**

```typescript
import type { Order } from '@/domain/logistics/enterprise/entities/order'

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

- [ ] **Create OrderWithRecipientPresenter**

```typescript
import type { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'

export class OrderWithRecipientPresenter {
  static toHTTP(orderWithRecipient: OrderWithRecipient) {
    return {
      id: orderWithRecipient.id.toString(),
      status: orderWithRecipient.status.getContent(),
      deliveryDriveId: orderWithRecipient.deliveryDriveId?.toString(),
      createdAt: orderWithRecipient.createdAt,
      updatedAt: orderWithRecipient.updatedAt,
      pickedAt: orderWithRecipient.pickedAt,
      deliveredAt: orderWithRecipient.deliveredAt,
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
    }
  }
}
```

- [ ] **Create RecipientPresenter**

```typescript
import type { Recipient } from '@/domain/logistics/enterprise/entities/recipient'

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

---

### Task 6: Create E2E Factories

**Files:**
- Create: `test/factories/recipient-factory.ts`
- Create: `test/factories/order-factory.ts`

- [ ] **Create RecipientFactory**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaRecipientMapper } from '@/infra/database/prisma/mappers/prisma-recipient-mapper'
import { makeRecipient } from './make-recipient'
import type { RecipientProps } from '@/domain/logistics/enterprise/entities/recipient'
import type { Recipient } from '@/domain/logistics/enterprise/entities/recipient'

@Injectable()
export class RecipientFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaRecipient(
    data: Partial<RecipientProps> = {},
  ): Promise<Recipient> {
    const recipient = makeRecipient(data)

    await this.prisma.recipient.create({
      data: PrismaRecipientMapper.toPrisma(recipient),
    })

    return recipient
  }
}
```

- [ ] **Create OrderFactory**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaOrderMapper } from '@/infra/database/prisma/mappers/prisma-order-mapper'
import { makeOrder } from './make-order'
import type { OrderProps } from '@/domain/logistics/enterprise/entities/order'
import type { Order } from '@/domain/logistics/enterprise/entities/order'

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

---

### Task 7: Create Recipients Controllers

**Files:**
- Create: `src/infra/http/controllers/register-recipient.controller.ts`
- Create: `src/infra/http/controllers/fetch-recipients.controller.ts`
- Create: `src/infra/http/controllers/get-recipient.controller.ts`
- Create: `src/infra/http/controllers/edit-recipient.controller.ts`
- Create: `src/infra/http/controllers/delete-recipient.controller.ts`

- [ ] **Create RegisterRecipientController**

```typescript
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { RegisterRecipientUseCase } from '@/domain/logistics/application/use-cases/register-recipient'
import { DocumentInvalidError } from '@/domain/logistics/enterprise/entities/errors/document-invalid-error'
import { ResourceAlreadyExistsError } from '@/core/errors/errors/resource-already-exists-error'
import { RecipientPresenter } from '../presenters/recipient-presenter'

const registerRecipientBodySchema = z.object({
  name: z.string(),
  document: z.string(),
  country: z.string(),
  zipCode: z.string(),
  state: z.string(),
  city: z.string(),
  street: z.string(),
  neighborhood: z.string(),
  complement: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
})

const bodyValidationSchema = new ZodValidationPipe(registerRecipientBodySchema)

type RegisterRecipientBodySchema = z.infer<typeof registerRecipientBodySchema>

@Controller('/recipients')
export class RegisterRecipientController {
  constructor(private registerRecipient: RegisterRecipientUseCase) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: RegisterRecipientBodySchema) {
    const {
      name,
      document,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    } = body

    const result = await this.registerRecipient.execute({
      name,
      document,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DocumentInvalidError:
          throw new BadRequestException(error.message)
        case ResourceAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      recipient: RecipientPresenter.toHTTP(result.value.recipient),
    }
  }
}
```

- [ ] **Create FetchRecipientsController**

```typescript
import { Controller, Get, Query } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchRecipientsUseCase } from '@/domain/logistics/application/use-cases/fetch-recipients'
import { RecipientPresenter } from '../presenters/recipient-presenter'

const pageQueryParamSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  perPage: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
})

const queryValidationSchema = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/recipients')
export class FetchRecipientsController {
  constructor(private fetchRecipients: FetchRecipientsUseCase) {}

  @Get()
  async handle(@Query(queryValidationSchema) query: PageQueryParamSchema) {
    const { page, perPage } = query

    const result = await this.fetchRecipients.execute({ page, perPage })

    const recipients = result.value.recipients.map(
      RecipientPresenter.toHTTP,
    )

    return { recipients }
  }
}
```

- [ ] **Create GetRecipientController**

```typescript
import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { GetRecipientByIdUseCase } from '@/domain/logistics/application/use-cases/get-recipient-by-id'
import { RecipientPresenter } from '../presenters/recipient-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

@Controller('/recipients')
export class GetRecipientController {
  constructor(private getRecipientById: GetRecipientByIdUseCase) {}

  @Get(':id')
  async handle(@Param('id') id: string) {
    const result = await this.getRecipientById.execute({ recipientId: id })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }

    return {
      recipient: RecipientPresenter.toHTTP(result.value.recipient),
    }
  }
}
```

- [ ] **Create EditRecipientController**

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { EditRecipientUseCase } from '@/domain/logistics/application/use-cases/edit-recipient'
import { DocumentInvalidError } from '@/domain/logistics/enterprise/entities/errors/document-invalid-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RecipientPresenter } from '../presenters/recipient-presenter'

const editRecipientBodySchema = z.object({
  name: z.string(),
  document: z.string(),
  country: z.string(),
  zipCode: z.string(),
  state: z.string(),
  city: z.string(),
  street: z.string(),
  neighborhood: z.string(),
  complement: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
})

const bodyValidationSchema = new ZodValidationPipe(editRecipientBodySchema)

type EditRecipientBodySchema = z.infer<typeof editRecipientBodySchema>

@Controller('/recipients')
export class EditRecipientController {
  constructor(private editRecipient: EditRecipientUseCase) {}

  @Patch(':id')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: EditRecipientBodySchema,
  ) {
    const {
      name,
      document,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    } = body

    const result = await this.editRecipient.execute({
      id,
      name,
      document,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DocumentInvalidError:
          throw new BadRequestException(error.message)
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      recipient: RecipientPresenter.toHTTP(result.value.recipient),
    }
  }
}
```

- [ ] **Create DeleteRecipientController**

```typescript
import {
  Controller,
  Delete,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { DeleteRecipientUseCase } from '@/domain/logistics/application/use-cases/delete-recipient'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

@Controller('/recipients')
export class DeleteRecipientController {
  constructor(private deleteRecipient: DeleteRecipientUseCase) {}

  @Delete(':id')
  async handle(@Param('id') id: string) {
    const result = await this.deleteRecipient.execute({ recipientId: id })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }
  }
}
```

---

### Task 8: Create Orders Controllers

**Files:**
- Create: `src/infra/http/controllers/register-order.controller.ts`
- Create: `src/infra/http/controllers/delete-order.controller.ts`
- Create: `src/infra/http/controllers/edit-order.controller.ts`
- Create: `src/infra/http/controllers/mark-order-as-awaiting.controller.ts`
- Create: `src/infra/http/controllers/pickup-order.controller.ts`
- Create: `src/infra/http/controllers/delivery-order.controller.ts`
- Create: `src/infra/http/controllers/return-order.controller.ts`
- Create: `src/infra/http/controllers/fetch-recent-orders.controller.ts`
- Create: `src/infra/http/controllers/fetch-nearby-orders.controller.ts`
- Create: `src/infra/http/controllers/fetch-driver-orders.controller.ts`
- Create: `src/infra/http/controllers/fetch-orders-by-recipient.controller.ts`
- Create: `src/infra/http/controllers/get-order-details.controller.ts`

- [ ] **Create RegisterOrderController**

```typescript
import {
  Body,
  Controller,
  NotFoundException,
  Post,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { RegisterOrderUseCase } from '@/domain/logistics/application/use-cases/register-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderPresenter } from '../presenters/order-presenter'

const registerOrderBodySchema = z.object({
  recipientId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(registerOrderBodySchema)

type RegisterOrderBodySchema = z.infer<typeof registerOrderBodySchema>

@Controller('/orders')
export class RegisterOrderController {
  constructor(private registerOrder: RegisterOrderUseCase) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: RegisterOrderBodySchema) {
    const { recipientId } = body

    const result = await this.registerOrder.execute({ recipientId })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
```

- [ ] **Create DeleteOrderController**

```typescript
import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  ForbiddenException,
} from '@nestjs/common'
import { DeleteOrderUseCase } from '@/domain/logistics/application/use-cases/delete-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

@Controller('/orders')
export class DeleteOrderController {
  constructor(private deleteOrder: DeleteOrderUseCase) {}

  @Delete(':id')
  async handle(@Param('id') id: string) {
    const result = await this.deleteOrder.execute({ orderId: id })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }
  }
}
```

- [ ] **Create EditOrderController**

```typescript
import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { EditOrderUseCase } from '@/domain/logistics/application/use-cases/edit-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderPresenter } from '../presenters/order-presenter'

const editOrderBodySchema = z.object({
  recipientId: z.string().optional(),
})

const bodyValidationSchema = new ZodValidationPipe(editOrderBodySchema)

type EditOrderBodySchema = z.infer<typeof editOrderBodySchema>

@Controller('/orders')
export class EditOrderController {
  constructor(private editOrder: EditOrderUseCase) {}

  @Patch(':id')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: EditOrderBodySchema,
  ) {
    const { recipientId } = body

    const result = await this.editOrder.execute({ orderId: id, recipientId })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
```

- [ ] **Create MarkOrderAsAwaitingController**

```typescript
import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { MarkOrderAsAwaitingUseCase } from '@/domain/logistics/application/use-cases/mark-order-as-awaiting'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'
import { OrderPresenter } from '../presenters/order-presenter'

@Controller('/orders')
export class MarkOrderAsAwaitingController {
  constructor(
    private markOrderAsAwaiting: MarkOrderAsAwaitingUseCase,
  ) {}

  @Post(':id/awaiting')
  async handle(@Param('id') id: string) {
    const result = await this.markOrderAsAwaiting.execute({ orderId: id })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case OrderCanNotTransitionToWaitingError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
```

- [ ] **Create PickupOrderController**

```typescript
import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  Body,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { PickUpOrderUseCase } from '@/domain/logistics/application/use-cases/pickup-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToPickUpError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-pickup-error'
import { OrderPresenter } from '../presenters/order-presenter'

const pickupOrderBodySchema = z.object({
  deliveryDriveId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(pickupOrderBodySchema)

type PickupOrderBodySchema = z.infer<typeof pickupOrderBodySchema>

@Controller('/orders')
export class PickupOrderController {
  constructor(private pickUpOrder: PickUpOrderUseCase) {}

  @Post(':id/pickup')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: PickupOrderBodySchema,
  ) {
    const { deliveryDriveId } = body

    const result = await this.pickUpOrder.execute({
      orderId: id,
      deliveryDriveId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case OrderCanNotTransitionToPickUpError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
```

- [ ] **Create DeliveryOrderController**

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { DeliveryOrderUseCase } from '@/domain/logistics/application/use-cases/delivery-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToDeliveryError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-delivery-error'
import { OrderPresenter } from '../presenters/order-presenter'

const deliveryOrderBodySchema = z.object({
  deliveryDriveId: z.string(),
  attachmentIds: z.array(z.string()),
})

const bodyValidationSchema = new ZodValidationPipe(deliveryOrderBodySchema)

type DeliveryOrderBodySchema = z.infer<typeof deliveryOrderBodySchema>

@Controller('/orders')
export class DeliveryOrderController {
  constructor(private deliveryOrder: DeliveryOrderUseCase) {}

  @Post(':id/deliver')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: DeliveryOrderBodySchema,
  ) {
    const { deliveryDriveId, attachmentIds } = body

    const result = await this.deliveryOrder.execute({
      orderId: id,
      deliveryDriveId,
      attachmentIds,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case DeliveryDriverDoesNotMatchError:
          throw new BadRequestException(error.message)
        case OrderCanNotTransitionToDeliveryError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
```

- [ ] **Create ReturnOrderController**

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { ReturnOrderUseCase } from '@/domain/logistics/application/use-cases/return-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToReturnedError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-returned-error'
import { OrderPresenter } from '../presenters/order-presenter'

const returnOrderBodySchema = z.object({
  deliveryDriveId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(returnOrderBodySchema)

type ReturnOrderBodySchema = z.infer<typeof returnOrderBodySchema>

@Controller('/orders')
export class ReturnOrderController {
  constructor(private returnOrder: ReturnOrderUseCase) {}

  @Post(':id/return')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: ReturnOrderBodySchema,
  ) {
    const { deliveryDriveId } = body

    const result = await this.returnOrder.execute({
      orderId: id,
      deliveryDriveId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case DeliveryDriverDoesNotMatchError:
          throw new BadRequestException(error.message)
        case OrderCanNotTransitionToReturnedError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
```

- [ ] **Create FetchRecentOrdersController**

```typescript
import { Controller, Get, Query } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchRecentOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-recent-orders'
import { OrderPresenter } from '../presenters/order-presenter'

const pageQueryParamSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  perPage: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
})

const queryValidationSchema = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/orders')
export class FetchRecentOrdersController {
  constructor(private fetchRecentOrders: FetchRecentOrdersUseCase) {}

  @Get()
  async handle(@Query(queryValidationSchema) query: PageQueryParamSchema) {
    const { page, perPage } = query

    const result = await this.fetchRecentOrders.execute({ page, perPage })

    const orders = result.value.orders.map(OrderPresenter.toHTTP)

    return { orders }
  }
}
```

- [ ] **Create FetchNearbyOrdersController**

```typescript
import { Controller, Get, Query } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchNearbyOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-nearby-orders'
import { OrderPresenter } from '../presenters/order-presenter'

const fetchNearbyOrdersQuerySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
})

const queryValidationSchema = new ZodValidationPipe(
  fetchNearbyOrdersQuerySchema,
)

type FetchNearbyOrdersQuerySchema = z.infer<
  typeof fetchNearbyOrdersQuerySchema
>

@Controller('/orders')
export class FetchNearbyOrdersController {
  constructor(private fetchNearbyOrders: FetchNearbyOrdersUseCase) {}

  @Get('/nearby')
  async handle(
    @Query(queryValidationSchema) query: FetchNearbyOrdersQuerySchema,
  ) {
    const { latitude, longitude } = query

    const result = await this.fetchNearbyOrders.execute({
      userLatitude: latitude,
      userLongitude: longitude,
    })

    const orders = result.value.orders.map(OrderPresenter.toHTTP)

    return { orders }
  }
}
```

- [ ] **Create FetchDriverOrdersController**

```typescript
import { Controller, Get, Query } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchDriverOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-driver-orders'
import { OrderPresenter } from '../presenters/order-presenter'
import type { StatusOptions } from '@/domain/logistics/enterprise/entities/values-objects/order-status'

const fetchDriverOrdersQuerySchema = z.object({
  driverId: z.string(),
  status: z
    .string()
    .transform((val) => val.split(',') as StatusOptions[]),
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  perPage: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
})

const queryValidationSchema = new ZodValidationPipe(
  fetchDriverOrdersQuerySchema,
)

type FetchDriverOrdersQuerySchema = z.infer<
  typeof fetchDriverOrdersQuerySchema
>

@Controller('/orders')
export class FetchDriverOrdersController {
  constructor(private fetchDriverOrders: FetchDriverOrdersUseCase) {}

  @Get('/driver')
  async handle(
    @Query(queryValidationSchema) query: FetchDriverOrdersQuerySchema,
  ) {
    const { driverId, status, page, perPage } = query

    const result = await this.fetchDriverOrders.execute({
      driverId,
      status,
      page,
      perPage,
    })

    const orders = result.value.orders.map(OrderPresenter.toHTTP)

    return { orders }
  }
}
```

- [ ] **Create FetchOrdersByRecipientController**

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchRecentOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-orders-by-recipient-id'
import { OrderPresenter } from '../presenters/order-presenter'

const pageQueryParamSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  perPage: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
})

const queryValidationSchema = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/orders')
export class FetchOrdersByRecipientController {
  constructor(
    private fetchOrdersByRecipient: FetchRecentOrdersUseCase,
  ) {}

  @Get('/recipient/:recipientId')
  async handle(
    @Param('recipientId') recipientId: string,
    @Query(queryValidationSchema) query: PageQueryParamSchema,
  ) {
    const { page, perPage } = query

    const result = await this.fetchOrdersByRecipient.execute({
      recipientId,
      page,
      perPage,
    })

    const orders = result.value.orders.map(OrderPresenter.toHTTP)

    return { orders }
  }
}
```

- [ ] **Create GetOrderDetailsController**

```typescript
import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { GetOrderDetailsByIdUseCase } from '@/domain/logistics/application/use-cases/get-order-details-by-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderWithRecipientPresenter } from '../presenters/order-with-recipient-presenter'

@Controller('/orders')
export class GetOrderDetailsController {
  constructor(
    private getOrderDetailsById: GetOrderDetailsByIdUseCase,
  ) {}

  @Get(':id')
  async handle(@Param('id') id: string) {
    const result = await this.getOrderDetailsById.execute({ orderId: id })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }

    return {
      order: OrderWithRecipientPresenter.toHTTP(result.value.order),
    }
  }
}
```

---

### Task 9: Update HttpModule

**Files:**
- Modify: `src/infra/http/http.module.ts`

- [ ] **Register all new controllers and factories in HttpModule**

```typescript
import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { StorageModule } from '../storage/storage.module'
import { AuthModule } from '../auth/auth.module'

// IAM Controllers
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { RegisterDeliveryDriverController } from './controllers/register-delivery-driver.controller'
import { FetchDeliveryDriversController } from './controllers/fetch-delivery-drivers.controller'
import { GetDeliveryDriversController } from './controllers/get-delivery-drivers.controller'
import { UpdateDeliveryDriversController } from './controllers/update-delivery-drivers.controller'
import { DeleteDeliveryDriversController } from './controllers/delete-delivery-drivers.controller'

// Logistics Controllers - Orders
import { RegisterOrderController } from './controllers/register-order.controller'
import { DeleteOrderController } from './controllers/delete-order.controller'
import { EditOrderController } from './controllers/edit-order.controller'
import { MarkOrderAsAwaitingController } from './controllers/mark-order-as-awaiting.controller'
import { PickupOrderController } from './controllers/pickup-order.controller'
import { DeliveryOrderController } from './controllers/delivery-order.controller'
import { ReturnOrderController } from './controllers/return-order.controller'
import { FetchRecentOrdersController } from './controllers/fetch-recent-orders.controller'
import { FetchNearbyOrdersController } from './controllers/fetch-nearby-orders.controller'
import { FetchDriverOrdersController } from './controllers/fetch-driver-orders.controller'
import { FetchOrdersByRecipientController } from './controllers/fetch-orders-by-recipient.controller'
import { GetOrderDetailsController } from './controllers/get-order-details.controller'

// Logistics Controllers - Recipients
import { RegisterRecipientController } from './controllers/register-recipient.controller'
import { FetchRecipientsController } from './controllers/fetch-recipients.controller'
import { GetRecipientController } from './controllers/get-recipient.controller'
import { EditRecipientController } from './controllers/edit-recipient.controller'
import { DeleteRecipientController } from './controllers/delete-recipient.controller'

// Attachments
import { UploadAttachmentController } from './controllers/upload-attachment.controller'

// IAM Use Cases
import { CreateAccountUseCase } from '@/domain/iam/application/use-cases/create-account'
import { AuthenticateUseCase } from '@/domain/iam/application/use-cases/authenticate'
import { RegisterDeliveryDriverUseCase } from '@/domain/iam/application/use-cases/register-delivery-driver'
import { FetchDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/fetch-delivery-drivers'
import { GetDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/get-delivery-driver'
import { UpdateDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/update-delivery-driver'
import { DeleteDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/delete-delivery-driver'

// Logistics Use Cases - Orders
import { RegisterOrderUseCase } from '@/domain/logistics/application/use-cases/register-order'
import { DeleteOrderUseCase } from '@/domain/logistics/application/use-cases/delete-order'
import { EditOrderUseCase } from '@/domain/logistics/application/use-cases/edit-order'
import { MarkOrderAsAwaitingUseCase } from '@/domain/logistics/application/use-cases/mark-order-as-awaiting'
import { PickUpOrderUseCase } from '@/domain/logistics/application/use-cases/pickup-order'
import { DeliveryOrderUseCase } from '@/domain/logistics/application/use-cases/delivery-order'
import { ReturnOrderUseCase } from '@/domain/logistics/application/use-cases/return-order'
import { FetchRecentOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-recent-orders'
import { FetchNearbyOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-nearby-orders'
import { FetchDriverOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-driver-orders'
import { FetchRecentOrdersUseCase as FetchOrdersByRecipientUseCase } from '@/domain/logistics/application/use-cases/fetch-orders-by-recipient-id'
import { GetOrderDetailsByIdUseCase } from '@/domain/logistics/application/use-cases/get-order-details-by-id'

// Logistics Use Cases - Recipients
import { RegisterRecipientUseCase } from '@/domain/logistics/application/use-cases/register-recipient'
import { FetchRecipientsUseCase } from '@/domain/logistics/application/use-cases/fetch-recipients'
import { GetRecipientByIdUseCase } from '@/domain/logistics/application/use-cases/get-recipient-by-id'
import { EditRecipientUseCase } from '@/domain/logistics/application/use-cases/edit-recipient'
import { DeleteRecipientUseCase } from '@/domain/logistics/application/use-cases/delete-recipient'

// Attachments
import { UploadAndCreateAttachmentUseCase } from '@/domain/logistics/application/use-cases/upload-and-create-attachment'
import { CryptographyModule } from '../cryptography/cryptography.module'

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule, CryptographyModule],
  controllers: [
    // IAM
    CreateAccountController,
    AuthenticateController,
    RegisterDeliveryDriverController,
    FetchDeliveryDriversController,
    GetDeliveryDriversController,
    UpdateDeliveryDriversController,
    DeleteDeliveryDriversController,

    // Logistics - Orders
    RegisterOrderController,
    DeleteOrderController,
    EditOrderController,
    MarkOrderAsAwaitingController,
    PickupOrderController,
    DeliveryOrderController,
    ReturnOrderController,
    FetchRecentOrdersController,
    FetchNearbyOrdersController,
    FetchDriverOrdersController,
    FetchOrdersByRecipientController,
    GetOrderDetailsController,

    // Logistics - Recipients
    RegisterRecipientController,
    FetchRecipientsController,
    GetRecipientController,
    EditRecipientController,
    DeleteRecipientController,

    // Attachments
    UploadAttachmentController,
  ],
  providers: [
    // IAM Use Cases
    CreateAccountUseCase,
    AuthenticateUseCase,
    RegisterDeliveryDriverUseCase,
    FetchDeliveryDriversUseCase,
    GetDeliveryDriversUseCase,
    UpdateDeliveryDriversUseCase,
    DeleteDeliveryDriversUseCase,

    // Logistics Use Cases - Orders
    RegisterOrderUseCase,
    DeleteOrderUseCase,
    EditOrderUseCase,
    MarkOrderAsAwaitingUseCase,
    PickUpOrderUseCase,
    DeliveryOrderUseCase,
    ReturnOrderUseCase,
    FetchRecentOrdersUseCase,
    FetchNearbyOrdersUseCase,
    FetchDriverOrdersUseCase,
    FetchOrdersByRecipientUseCase,
    GetOrderDetailsByIdUseCase,

    // Logistics Use Cases - Recipients
    RegisterRecipientUseCase,
    FetchRecipientsUseCase,
    GetRecipientByIdUseCase,
    EditRecipientUseCase,
    DeleteRecipientUseCase,

    // Attachments
    UploadAndCreateAttachmentUseCase,
  ],
})
export class HttpModule {}
```

---

### Task 10: Create E2E Tests for Recipients

**Files:**
- Create: `src/infra/http/controllers/register-recipient.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/fetch-recipients.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/get-recipient.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/edit-recipient.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/delete-recipient.controller.e2e-spec.ts`

- [ ] **Create RegisterRecipientController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'

describe('Register Recipient (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)

    await app.init()
  })

  test('[POST] /recipients', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        document: '12345678901',
        country: 'Brazil',
        zipCode: '12345-678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua Example',
        neighborhood: 'Centro',
        latitude: -23.55052,
        longitude: -46.633308,
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      recipient: expect.objectContaining({
        name: 'John Doe',
      }),
    })
  })
})
```

- [ ] **Create FetchRecipientsController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'

describe('Fetch Recipients (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[GET] /recipients', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    await recipientFactory.makePrismaRecipient({ name: 'John Doe' })
    await recipientFactory.makePrismaRecipient({ name: 'Jane Doe' })

    const response = await request(app.getHttpServer())
      .get('/recipients')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.recipients).toHaveLength(2)
  })
})
```

- [ ] **Create GetRecipientController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'

describe('Get Recipient (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[GET] /recipients/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const recipient = await recipientFactory.makePrismaRecipient({
      name: 'John Doe',
    })

    const response = await request(app.getHttpServer())
      .get(`/recipients/${recipient.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.recipient).toEqual(
      expect.objectContaining({
        name: 'John Doe',
      }),
    )
  })

  test('[GET] /recipients/:id - 404 when not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .get('/recipients/non-existing-id')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
  })
})
```

- [ ] **Create EditRecipientController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'

describe('Edit Recipient (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[PATCH] /recipients/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const recipient = await recipientFactory.makePrismaRecipient({
      name: 'Old Name',
    })

    const response = await request(app.getHttpServer())
      .patch(`/recipients/${recipient.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Name',
        document: '12345678901',
        country: 'Brazil',
        zipCode: '12345-678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua Example',
        neighborhood: 'Centro',
        latitude: -23.55052,
        longitude: -46.633308,
      })

    expect(response.status).toBe(200)
    expect(response.body.recipient).toEqual(
      expect.objectContaining({
        name: 'New Name',
      }),
    )
  })
})
```

- [ ] **Create DeleteRecipientController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'

describe('Delete Recipient (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[DELETE] /recipients/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const recipient = await recipientFactory.makePrismaRecipient()

    const response = await request(app.getHttpServer())
      .delete(`/recipients/${recipient.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)

    const persisted = await prisma.recipient.findUnique({
      where: { id: recipient.id.toString() },
    })

    expect(persisted).toBeNull()
  })
})
```

---

### Task 11: Create E2E Tests for Orders

**Files:**
- Create: `src/infra/http/controllers/register-order.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/delete-order.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/edit-order.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/mark-order-as-awaiting.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/pickup-order.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/delivery-order.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/return-order.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/fetch-recent-orders.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/fetch-nearby-orders.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/fetch-driver-orders.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/fetch-orders-by-recipient.controller.e2e-spec.ts`
- Create: `src/infra/http/controllers/get-order-details.controller.e2e-spec.ts`

- [ ] **Create RegisterOrderController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'

describe('Register Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[POST] /orders', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const recipient = await recipientFactory.makePrismaRecipient()

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipientId: recipient.id.toString() })

    expect(response.status).toBe(201)
    expect(response.body.order).toEqual(
      expect.objectContaining({
        status: 'CREATED',
      }),
    )
  })

  test('[POST] /orders - 404 when recipient not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipientId: 'non-existing-id' })

    expect(response.status).toBe(404)
  })
})
```

- [ ] **Create DeleteOrderController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Delete Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[DELETE] /orders/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const order = await orderFactory.makePrismaOrder()

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .delete(`/orders/${order.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)

    const persisted = await prisma.order.findUnique({
      where: { id: order.id.toString() },
    })

    expect(persisted).toBeNull()
  })

  test('[DELETE] /orders/:id - 404 when not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .delete('/orders/non-existing-id')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
  })
})
```

- [ ] **Create EditOrderController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'
import { RecipientFactory } from '@test/factories/recipient-factory'

describe('Edit Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[PATCH] /orders/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const order = await orderFactory.makePrismaOrder()
    const newRecipient = await recipientFactory.makePrismaRecipient()

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .patch(`/orders/${order.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipientId: newRecipient.id.toString() })

    expect(response.status).toBe(200)
    expect(response.body.order.recipientId).toBe(
      newRecipient.id.toString(),
    )
  })
})
```

- [ ] **Create MarkOrderAsAwaitingController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Mark Order As Awaiting (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[POST] /orders/:id/awaiting', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const order = await orderFactory.makePrismaOrder()

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post(`/orders/${order.id.toString()}/awaiting`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.order.status).toBe('WAITING')
  })
})
```

- [ ] **Create PickupOrderController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Pickup Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[POST] /orders/:id/pickup', async () => {
    const driver = await userFactory.makePrismaUser({ role: 'DRIVER' })
    const order = await orderFactory.makePrismaOrder()

    // First, mark as awaiting
    await prisma.order.update({
      where: { id: order.id.toString() },
      data: { status: 'WAITING' },
    })

    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post(`/orders/${order.id.toString()}/pickup`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryDriveId: driver.id.toString() })

    expect(response.status).toBe(200)
    expect(response.body.order.status).toBe('PICKED_UP')
  })
})
```

- [ ] **Create DeliveryOrderController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'
import { faker } from '@faker-js/faker'

describe('Delivery Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[POST] /orders/:id/deliver', async () => {
    const driver = await userFactory.makePrismaUser({ role: 'DRIVER' })
    const order = await orderFactory.makePrismaOrder()

    // Set order status to PICKED_UP with driver assigned
    await prisma.order.update({
      where: { id: order.id.toString() },
      data: {
        status: 'PICKED_UP',
        deliveryDriveId: driver.id.toString(),
        pickedAt: new Date(),
      },
    })

    const attachment = await prisma.attachment.create({
      data: {
        title: faker.lorem.word(),
        url: faker.internet.url(),
      },
    })

    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post(`/orders/${order.id.toString()}/deliver`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deliveryDriveId: driver.id.toString(),
        attachmentIds: [attachment.id],
      })

    expect(response.status).toBe(200)
    expect(response.body.order.status).toBe('DELIVERED')
  })
})
```

- [ ] **Create ReturnOrderController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Return Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[POST] /orders/:id/return', async () => {
    const driver = await userFactory.makePrismaUser({ role: 'DRIVER' })
    const order = await orderFactory.makePrismaOrder()

    // Set order status to PICKED_UP with driver assigned
    await prisma.order.update({
      where: { id: order.id.toString() },
      data: {
        status: 'PICKED_UP',
        deliveryDriveId: driver.id.toString(),
        pickedAt: new Date(),
      },
    })

    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post(`/orders/${order.id.toString()}/return`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryDriveId: driver.id.toString() })

    expect(response.status).toBe(200)
    expect(response.body.order.status).toBe('RETURNED')
  })
})
```

- [ ] **Create FetchRecentOrdersController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Fetch Recent Orders (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[GET] /orders', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    await orderFactory.makePrismaOrder()
    await orderFactory.makePrismaOrder()
    await orderFactory.makePrismaOrder()

    const response = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.orders).toHaveLength(3)
  })
})
```

- [ ] **Create FetchNearbyOrdersController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'
import { OrderFactory } from '@test/factories/order-factory'

describe('Fetch Nearby Orders (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[GET] /orders/nearby', async () => {
    const driver = await userFactory.makePrismaUser({ role: 'DRIVER' })
    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    // Create a recipient nearby
    const nearbyRecipient = await recipientFactory.makePrismaRecipient({
      latitude: -23.55052,
      longitude: -46.633308,
    })

    await orderFactory.makePrismaOrder({
      recipientId: nearbyRecipient.id,
    })

    const response = await request(app.getHttpServer())
      .get('/orders/nearby')
      .query({ latitude: -23.55052, longitude: -46.633308 })
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.orders).toHaveLength(1)
  })
})
```

- [ ] **Create FetchDriverOrdersController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Fetch Driver Orders (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[GET] /orders/driver', async () => {
    const driver = await userFactory.makePrismaUser({ role: 'DRIVER' })
    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    const order = await orderFactory.makePrismaOrder()

    // Assign driver to the order
    await prisma.order.update({
      where: { id: order.id.toString() },
      data: {
        status: 'PICKED_UP',
        deliveryDriveId: driver.id.toString(),
        pickedAt: new Date(),
      },
    })

    const response = await request(app.getHttpServer())
      .get('/orders/driver')
      .query({ driverId: driver.id.toString(), status: 'PICKED_UP' })
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.orders).toHaveLength(1)
  })
})
```

- [ ] **Create FetchOrdersByRecipientController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { RecipientFactory } from '@test/factories/recipient-factory'
import { OrderFactory } from '@test/factories/order-factory'

describe('Fetch Orders By Recipient (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[GET] /orders/recipient/:recipientId', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const recipient = await recipientFactory.makePrismaRecipient()

    await orderFactory.makePrismaOrder({ recipientId: recipient.id })
    await orderFactory.makePrismaOrder({ recipientId: recipient.id })

    const response = await request(app.getHttpServer())
      .get(`/orders/recipient/${recipient.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.orders).toHaveLength(2)
  })
})
```

- [ ] **Create GetOrderDetailsController E2E test**

```typescript
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { OrderFactory } from '@test/factories/order-factory'

describe('Get Order Details (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)

    await app.init()
  })

  test('[GET] /orders/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const order = await orderFactory.makePrismaOrder()

    const response = await request(app.getHttpServer())
      .get(`/orders/${order.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.order).toEqual(
      expect.objectContaining({
        id: order.id.toString(),
        status: 'CREATED',
      }),
    )
  })

  test('[GET] /orders/:id - 404 when not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: 'ADMIN' })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .get('/orders/non-existing-id')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
  })
})
```

---

### Task 12: Run Build and Verify

- [ ] **Run TypeScript compilation to verify no errors**

```bash
npx tsc --noEmit
```

Expected: Clean compilation with no errors.

- [ ] **Run lint to verify code style**

```bash
npm run lint
```

Expected: Clean lint output.

- [ ] **Run all domain unit tests**

```bash
npx vitest run src/domain/logistics
```

Expected: All logistics domain tests pass.

- [ ] **Run all E2E tests**

```bash
npx vitest run --config vitest.config.e2e.ts
```

Expected: All E2E tests pass.
