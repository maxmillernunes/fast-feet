import { Module } from '@nestjs/common'
import { StorageModule } from '../storage/storage.module'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'

import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { RegisterDeliveryDriverController } from './controllers/register-delivery-driver.controller'
import { CreateAccountUseCase } from '@/domain/iam/application/use-cases/create-account'
import { AuthenticateUseCase } from '@/domain/iam/application/use-cases/authenticate'
import { FetchDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/fetch-delivery-drivers'
import { FetchDeliveryDriversController } from './controllers/fetch-delivery-drivers.controller'
import { GetDeliveryDriversController } from './controllers/get-delivery-drivers.controller'
import { GetDeliveryDriverByIdUseCase } from '@/domain/iam/application/use-cases/get-delivery-driver-by-id'
import { DeleteDeliveryDriversController } from './controllers/delete-delivery-drivers.controller'
import { DeleteDeliveryDriverByIdUseCase } from '@/domain/iam/application/use-cases/delete-delivery-driver'
import { UpdateDeliveryDriversController } from './controllers/update-delivery-drivers.controller'
import { UpdateDeliveryDriverUseCase } from '@/domain/iam/application/use-cases/update-delivery-driver'
import { UploadAttachmentController } from './controllers/upload-attachment.controller'
import { UploadAndCreateAttachmentUseCase } from '@/domain/logistics/application/use-cases/upload-and-create-attachment'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    RegisterDeliveryDriverController,
    FetchDeliveryDriversController,
    GetDeliveryDriversController,
    DeleteDeliveryDriversController,
    UpdateDeliveryDriversController,

    UploadAttachmentController,
  ],
  providers: [
    CreateAccountUseCase,
    AuthenticateUseCase,
    FetchDeliveryDriversUseCase,
    GetDeliveryDriverByIdUseCase,
    DeleteDeliveryDriverByIdUseCase,
    UpdateDeliveryDriverUseCase,
    UploadAndCreateAttachmentUseCase,
  ],
})
export class HttpModule {}
