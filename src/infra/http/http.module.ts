import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { DatabaseModule } from '../database/database.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { RegisterDeliveryDriverController } from './controllers/register-delivery-driver.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    RegisterDeliveryDriverController,
  ],
  providers: [],
})
export class HttpModule {}
