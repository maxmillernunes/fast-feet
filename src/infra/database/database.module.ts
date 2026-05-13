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
