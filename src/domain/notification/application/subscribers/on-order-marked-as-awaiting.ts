import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { OrderMarkedAsAwaitingEvent } from '@/domain/logistics/enterprise/events/order-marked-as-awaiting-events'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderMarkedAsAwaiting implements EventHandler {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.SendNewOrderNotificationWhenOrderIsMarkedAsAwaiting.bind(this),
      OrderMarkedAsAwaitingEvent.name,
    )
  }

  private async SendNewOrderNotificationWhenOrderIsMarkedAsAwaiting({
    order,
  }: OrderMarkedAsAwaitingEvent) {
    const recipient = await this.recipientsRepository.findById(
      order.recipientId.toString(),
    )

    if (recipient) {
      await this.sendNotificationUseCase.execute({
        recipientId: recipient.id.toString(),
        title: 'Atualização na entrega!',
        content: `Olá ${recipient.name}, sua entrega esta pronta para retirada!`,
      })
    }
  }
}
