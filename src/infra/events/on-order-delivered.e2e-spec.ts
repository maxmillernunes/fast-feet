import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'
import { OrderFactory } from '@test/factories/make-order'
import { RecipientFactory } from '@test/factories/make-recipient'
import { AttachmentFactory } from '@test/factories/make-attachment'
import { waitFor } from '@test/utils/wait-for'

describe('On Order Delivered (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let recipientFactory: RecipientFactory
  let attachmentFactory: AttachmentFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        UserFactory,
        OrderFactory,
        RecipientFactory,
        AttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)

    await app.init()
  })

  it('When an order is delivered, it should trigger the domain event sending notification', async () => {
    const driver = await userFactory.makePrismaUser({ role: UserRole.DRIVER })
    const recipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
    })

    await prisma.order.update({
      where: { id: order.id.toString() },
      data: {
        status: 'PICKED_UP',
        deliveryDriveId: driver.id.toString(),
        pickedAt: new Date(),
      },
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    await request(app.getHttpServer())
      .post(`/orders/${order.id.toString()}/deliver`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deliveryDriveId: driver.id.toString(),
        attachmentIds: [attachment.id.toString()],
      })

    await waitFor(async () => {
      const notificationOnDatabase = await prisma.notification.findFirst({
        where: {
          recipientId: recipient.id.toString(),
        },
      })

      expect(notificationOnDatabase).toBeTruthy()
    })
  })
})
