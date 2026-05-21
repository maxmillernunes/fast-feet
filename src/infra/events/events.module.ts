import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'

import { OnOrderCreated } from '@/domain/notification/application/subscribers/on-order-created'
import { OnOrderDelivered } from '@/domain/notification/application/subscribers/on-order-delivered'
import { OnOrderMarkedAsAwaiting } from '@/domain/notification/application/subscribers/on-order-marked-as-awaiting'
import { OnOrderPickedUp } from '@/domain/notification/application/subscribers/on-order-picked-up'

import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'

@Module({
  imports: [DatabaseModule],
  providers: [
    OnOrderCreated,
    OnOrderMarkedAsAwaiting,
    OnOrderPickedUp,
    OnOrderDelivered,

    SendNotificationUseCase,
  ],
})
export class EventsModule {}
