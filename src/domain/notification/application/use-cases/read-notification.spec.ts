import { InMemoryNotificationsRepository } from '@test/repositories/in-memory-notifications-repository'
import { ReadNotificationUseCase } from './read-notification'
import { makeNotification } from '@test/factories/make-notification'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let notificationsRepository: InMemoryNotificationsRepository
let sut: ReadNotificationUseCase

describe('Read Notification Use Case', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository()
    sut = new ReadNotificationUseCase(notificationsRepository)
  })

  it('should be able to read a notification', async () => {
    const notification = makeNotification()

    await notificationsRepository.create(notification)

    const result = await sut.execute({
      recipientId: notification.recipientId.toString(),
      notificationId: notification.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(notificationsRepository.items[0].readAt).toEqual(expect.any(Date))
  })

  it('should not be able to read a notification from another recipient', async () => {
    const notification = makeNotification()

    await notificationsRepository.create(notification)

    const result = await sut.execute({
      recipientId: 'mismatched-recipient-id',
      notificationId: notification.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
