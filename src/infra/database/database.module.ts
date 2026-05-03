import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { EnvModule } from '../env/env.module'
import { UsersRepository } from '@/domain/iam/application/repositories/users-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { AttachmentsRepository } from '@/domain/logistics/application/repositories/attachments-repository'
import { PrismaAttachmentsRepository } from './prisma/repositories/prisma-attachments-repository'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,

    // Repositories
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: AttachmentsRepository,
      useClass: PrismaAttachmentsRepository,
    },
  ],
  exports: [
    PrismaService,

    // Repositories
    UsersRepository,
    AttachmentsRepository,
  ],
})
export class DatabaseModule {}
