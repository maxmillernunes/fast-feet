import { Module } from '@nestjs/common'
import { AwsStorage } from './aws-storage'
import { Uploader } from '@/domain/logistics/application/storage/uploader'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: Uploader,
      useClass: AwsStorage,
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
