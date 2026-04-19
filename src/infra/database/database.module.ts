import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { EnvModule } from '../env/env.module'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,

    // Repositories
    PrismaUsersRepository,
  ],
  exports: [
    PrismaService,

    // Repositories
    PrismaUsersRepository,
  ],
})
export class DatabaseModule {}
