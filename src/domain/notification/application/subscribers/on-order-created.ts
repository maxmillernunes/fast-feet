import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { OrderCreatedEvent } from '@/domain/logistics/enterprise/events/order-created-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderCreated implements EventHandler {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewOrderNotification.bind(this),
      OrderCreatedEvent.name,
    )
  }

  private async sendNewOrderNotification({ order }: OrderCreatedEvent) {
    const recipient = await this.recipientsRepository.findById(
      order.recipientId.toString(),
    )

    if (recipient) {
      await this.sendNotificationUseCase.execute({
        recipientId: recipient.id.toString(),
        title: 'Nova entrega registrada!',
        content: `Olá ${recipient.name}, sua entrega foi registrada com sucesso!`,
      })
    }
  }
}
