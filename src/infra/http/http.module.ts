import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DatabaseModule } from '../database/database.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { RegisterDeliveryDriverController } from './controllers/register-delivery-driver.controller'
import { CreateAccountUseCase } from '@/domain/iam/application/use-cases/create-account'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateUseCase } from '@/domain/iam/application/use-cases/authenticate'
import { FetchDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/fetch-delivery-drivers'
import { FetchDeliveryDriversController } from './controllers/fetch-delivery-drivers.controller'
import { GetDeliveryDriversController } from './controllers/get-delivery-drivers.controller'
import { GetDeliveryDriverByIdUseCase } from '@/domain/iam/application/use-cases/get-delivery-driver-by-id'
import { DeleteDeliveryDriversController } from './controllers/delete-delivery-drivers.controller'
import { DeleteDeliveryDriverByIdUseCase } from '@/domain/iam/application/use-cases/delete-delivery-driver'
import { UpdateDeliveryDriversController } from './controllers/update-delivery-drivers.controller'
import { UpdateDeliveryDriverUseCase } from '@/domain/iam/application/use-cases/update-delivery-driver'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    RegisterDeliveryDriverController,
    FetchDeliveryDriversController,
    GetDeliveryDriversController,
    DeleteDeliveryDriversController,
    UpdateDeliveryDriversController,
  ],
  providers: [
    CreateAccountUseCase,
    AuthenticateUseCase,
    FetchDeliveryDriversUseCase,
    GetDeliveryDriverByIdUseCase,
    DeleteDeliveryDriverByIdUseCase,
    UpdateDeliveryDriverUseCase,
  ],
})
export class HttpModule {}
