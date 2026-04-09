import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { OrderDeliveredEvent } from '@/domain/logistics/enterprise/events/order-delivered-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderDelivered implements EventHandler {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNotificationWhenOrderIsDelivered.bind(this),
      OrderDeliveredEvent.name,
    )
  }

  private async sendNotificationWhenOrderIsDelivered({
    order,
  }: OrderDeliveredEvent) {
    const recipient = await this.recipientsRepository.findById(
      order.recipientId.toString(),
    )

    if (recipient) {
      await this.sendNotificationUseCase.execute({
        recipientId: recipient.id.toString(),
        title: 'Encomenda entregue!',
        content: `Olá ${recipient.name}, sua encomenda foi entregue com sucesso!`,
      })
    }
  }
}
