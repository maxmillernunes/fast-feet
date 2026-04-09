import { DomainEvents } from '@/core/events/domain-events'
import type { EventHandler } from '@/core/events/event-handler'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { OrderPickedUpEvent } from '@/domain/logistics/enterprise/events/order-picked-up-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderPickedUp implements EventHandler {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNotificationWhenOrderIsPickedUp.bind(this),
      OrderPickedUpEvent.name,
    )
  }

  private async sendNotificationWhenOrderIsPickedUp({
    order,
  }: OrderPickedUpEvent) {
    const recipient = await this.recipientsRepository.findById(
      order.recipientId.toString(),
    )

    if (recipient) {
      await this.sendNotificationUseCase.execute({
        recipientId: recipient.id.toString(),
        title: 'Encomenda retirada!',
        content: `Olá ${recipient.name}, sua encomenda foi retirada pelo entregador.`,
      })
    }
  }
}
