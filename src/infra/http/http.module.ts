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

// Logistics Controllers - Recipients
import { RegisterRecipientController } from './controllers/register-recipient.controller'
import { FetchRecipientsController } from './controllers/fetch-recipients.controller'
import { GetRecipientController } from './controllers/get-recipient.controller'
import { EditRecipientController } from './controllers/edit-recipient.controller'
import { DeleteRecipientController } from './controllers/delete-recipient.controller'

// Logistics Controllers - Orders
import { RegisterOrderController } from './controllers/register-order.controller'
import { DeleteOrderController } from './controllers/delete-order.controller'
import { EditOrderController } from './controllers/edit-order.controller'
import { MarkOrderAsAwaitingController } from './controllers/mark-order-as-awaiting.controller'
import { PickUpOrderController } from './controllers/pickup-order.controller'
import { DeliveryOrderController } from './controllers/delivery-order.controller'
import { ReturnOrderController } from './controllers/return-order.controller'
import { FetchRecentOrdersController } from './controllers/fetch-recent-orders.controller'
import { FetchNearbyOrdersController } from './controllers/fetch-nearby-orders.controller'
import { FetchDriverOrdersController } from './controllers/fetch-driver-orders.controller'
import { FetchOrdersByRecipientController } from './controllers/fetch-orders-by-recipient.controller'
import { GetOrderDetailsController } from './controllers/get-order-details.controller'

// Logistics Use Cases - Recipients
import { RegisterRecipientUseCase } from '@/domain/logistics/application/use-cases/register-recipient'
import { FetchRecipientsUseCase } from '@/domain/logistics/application/use-cases/fetch-recipients'
import { GetRecipientByIdUseCase } from '@/domain/logistics/application/use-cases/get-recipient-by-id'
import { EditRecipientUseCase } from '@/domain/logistics/application/use-cases/edit-recipient'
import { DeleteRecipientUseCase } from '@/domain/logistics/application/use-cases/delete-recipient'

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

    RegisterRecipientController,
    FetchRecipientsController,
    GetRecipientController,
    EditRecipientController,
    DeleteRecipientController,

    RegisterOrderController,
    DeleteOrderController,
    EditOrderController,
    MarkOrderAsAwaitingController,
    PickUpOrderController,
    DeliveryOrderController,
    ReturnOrderController,
    FetchRecentOrdersController,
    FetchNearbyOrdersController,
    FetchDriverOrdersController,
    FetchOrdersByRecipientController,
    GetOrderDetailsController,
  ],
  providers: [
    CreateAccountUseCase,
    AuthenticateUseCase,

    FetchDeliveryDriversUseCase,
    GetDeliveryDriverByIdUseCase,
    DeleteDeliveryDriverByIdUseCase,
    UpdateDeliveryDriverUseCase,
    UploadAndCreateAttachmentUseCase,

    RegisterRecipientUseCase,
    FetchRecipientsUseCase,
    GetRecipientByIdUseCase,
    EditRecipientUseCase,
    DeleteRecipientUseCase,

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
  ],
})
export class HttpModule {}
