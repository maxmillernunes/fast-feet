import { InMemoryOrdersRepository } from '@test/repositories/in-memory-orders-repository'
import { makeOrder } from '@test/factories/make-order'
import { DeliveryOrderUseCase } from './delivery-order'
import { OrderStatus } from '../../enterprise/entities/values-objects/order-status'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToDeliveryError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-delivery-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { InMemoryRecipientsRepository } from '@test/repositories/in-memory-recipients-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InMemoryAttachmentsRepository } from '@test/repositories/in-memory-attachments-repository'
import { InMemoryOrderAttachmentsRepository } from '@test/repositories/in-memory-order-attachments-repository'
import { makeAttachment } from '@test/factories/make-attachment'

let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemoryRecipientRepository: InMemoryRecipientsRepository
let inMemoryOrdersRepository: InMemoryOrdersRepository
let sut: DeliveryOrderUseCase

describe('Delivery Order', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemoryRecipientRepository = new InMemoryRecipientsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
      inMemoryAttachmentsRepository,
      inMemoryRecipientRepository,
    )
    sut = new DeliveryOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryAttachmentsRepository,
    )
  })

  it('should be able to deliver an order', async () => {
    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await inMemoryOrdersRepository.create(order)

    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()

    await inMemoryAttachmentsRepository.create(attachment1)
    await inMemoryAttachmentsRepository.create(attachment2)

    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
      attachmentIds: [attachment1.id.toString(), attachment2.id.toString()],
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.objectContaining({
        status: expect.objectContaining({
          value: 'DELIVERED',
        }),
        deliveredAt: expect.any(Date),
      }),
    })
    expect(inMemoryOrderAttachmentsRepository.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attachmentId: attachment1.id,
        }),
        expect.objectContaining({
          attachmentId: attachment2.id,
        }),
      ]),
    )
  })

  it('should not be able to deliver an order when the order does not exists', async () => {
    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: 'non-existing-order-id',
      attachmentIds: ['1', '2'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to deliver an order when status is WAITING', async () => {
    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()

    await inMemoryAttachmentsRepository.create(attachment1)
    await inMemoryAttachmentsRepository.create(attachment2)

    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('WAITING'),
    })
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliveryDriveId: 'driver-1',
      orderId: order.id.toString(),
      attachmentIds: [attachment1.id.toString(), attachment2.id.toString()],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderCanNotTransitionToDeliveryError)
  })

  it('should not be able to deliver an order when the delivery driver does not match', async () => {
    const attachment1 = makeAttachment()
    const attachment2 = makeAttachment()

    await inMemoryAttachmentsRepository.create(attachment1)
    await inMemoryAttachmentsRepository.create(attachment2)

    const order = makeOrder({
      deliveryDriveId: new UniqueEntityId('driver-1'),
      status: OrderStatus.create('PICKED_UP'),
    })
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliveryDriveId: 'driver-2',
      orderId: order.id.toString(),
      attachmentIds: [attachment1.id.toString(), attachment2.id.toString()],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(DeliveryDriverDoesNotMatchError)
  })
})
