import { makeOrder } from '@test/factories/make-order'
import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { OnOrderMarkedAsAwaiting } from './on-order-marked-as-awaiting'
import { InMemoryNotificationsRepository } from '@test/repositories/in-memory-notifications-repository'
import {
  SendNotificationUseCase,
  type SendNotificationUseCaseRequest,
  type SendNotificationUseCaseResponse,
} from '../use-cases/send-notification'
import { makeRecipient } from '@test/factories/make-recipient'
import { waitFor } from '@test/utils/wait-for'
import type { MockInstance } from 'vitest'
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

describe('On Order Marked as Awaiting', () => {
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

    new OnOrderMarkedAsAwaiting(
      inMemoryRecipientsRepository,
      sendNotificationUseCase,
    )
  })

  it('should send a notification when an order is marked as awaiting', async () => {
    const recipient = makeRecipient()
    inMemoryRecipientsRepository.create(recipient)

    const order = makeOrder({ recipientId: recipient.id })
    inMemoryOrdersRepository.create(order)

    order.markAsAwaiting()
    await inMemoryOrdersRepository.save(order)

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalled()
    })
  })
})
