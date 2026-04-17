import type { MockInstance } from 'vitest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DomainEvents } from '@/core/events/domain-events'
import { makeOrder } from '@test/factories/make-order'
import { OnOrderDelivered } from './on-order-delivered'
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import {
  SendNotificationUseCase,
  type SendNotificationUseCaseRequest,
  type SendNotificationUseCaseResponse,
} from '../use-cases/send-notification'
import { InMemoryNotificationsRepository } from '@test/repositories/in-memory-notifications-repository'
import { makeRecipient } from '@test/factories/make-recipient'
import { waitFor } from '@test/utils/wait-for'
import { InMemoryOrderAttachmentsRepository } from '@test/repositories/in-memory-order-attachments-repository'
import { InMemoryAttachmentsRepository } from '@test/repositories/in-memory-attachments-repository'

let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository

let sendNotificationUseCase: SendNotificationUseCase
let notificationsRepository: InMemoryNotificationsRepository

let sendNotificationExecuteSpy: MockInstance<
  (
    data: SendNotificationUseCaseRequest,
  ) => Promise<SendNotificationUseCaseResponse>
>

describe('On Order Delivered', () => {
  beforeEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()

    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
      inMemoryAttachmentsRepository,
      inMemoryRecipientsRepository,
    )

    notificationsRepository = new InMemoryNotificationsRepository()
    sendNotificationUseCase = new SendNotificationUseCase(
      notificationsRepository,
    )

    sendNotificationExecuteSpy = vi.spyOn(sendNotificationUseCase, 'execute')

    new OnOrderDelivered(inMemoryRecipientsRepository, sendNotificationUseCase)
  })

  it('should send a notification when an order is delivered', async () => {
    const recipient = makeRecipient()
    inMemoryRecipientsRepository.create(recipient)

    const order = makeOrder({ recipientId: recipient.id })
    inMemoryOrdersRepository.create(order)

    order.markAsAwaiting()
    await inMemoryOrdersRepository.save(order)

    const deliveryDriverId = new UniqueEntityId()
    order.pickUp(deliveryDriverId)
    await inMemoryOrdersRepository.save(order)

    order.deliver(deliveryDriverId, [])
    await inMemoryOrdersRepository.save(order)

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalled()
    })

    expect(sendNotificationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: recipient.id.toString(),
        title: 'Encomenda entregue!',
        content: `Olá ${recipient.name}, sua encomenda foi entregue com sucesso!`,
      }),
    )
  })
})
