import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DatabaseModule } from '../database/database.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { RegisterDeliveryDriverController } from './controllers/register-delivery-driver.controller'
import { CreateAccountUseCase } from '@/domain/iam/application/use-cases/create-account'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateUseCase } from '@/domain/iam/application/use-cases/authenticate'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    RegisterDeliveryDriverController,
  ],
  providers: [CreateAccountUseCase, AuthenticateUseCase],
})
export class HttpModule {}
