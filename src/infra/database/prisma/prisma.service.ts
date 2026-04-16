import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { PrismaClient } from './client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(envService: EnvService) {
    super({
      adapter: new PrismaPg(
        {
          connectionString: envService.get('DATABASE_URL'),
        },
        { schema: envService.get('DATABASE_SCHEMA') },
      ),
      log: ['error', 'warn'],
    })
  }

  onModuleInit() {
    return this.$connect()
  }

  onModuleDestroy() {
    return this.$disconnect()
  }
}
