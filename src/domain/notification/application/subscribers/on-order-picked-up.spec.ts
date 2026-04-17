import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { MockInstance } from 'vitest'
import { makeOrder } from '@test/factories/make-order'
import { OnOrderPickedUp } from './on-order-picked-up'
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
import { OrderStatus } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
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

describe('On Order Picked Up', () => {
  beforeEach(() => {
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

    new OnOrderPickedUp(inMemoryRecipientsRepository, sendNotificationUseCase)
  })

  it('should send a notification when an order is picked up', async () => {
    const recipient = makeRecipient()
    inMemoryRecipientsRepository.create(recipient)

    const order = makeOrder({
      recipientId: recipient.id,
      status: OrderStatus.create('WAITING'),
    })
    inMemoryOrdersRepository.create(order)

    const deliveryDriverId = new UniqueEntityId()
    order.pickUp(deliveryDriverId)
    await inMemoryOrdersRepository.save(order)

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalled()
    })

    expect(sendNotificationExecuteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: recipient.id.toString(),
        title: 'Encomenda retirada!',
        content: expect.stringContaining(recipient.name),
      }),
    )
  })
})
