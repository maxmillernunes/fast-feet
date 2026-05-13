import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'
import { OrderFactory } from '@test/factories/make-order'
import { RecipientFactory } from '@test/factories/make-recipient'

describe('Mark Order As Awaiting (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let orderFactory: OrderFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, OrderFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    orderFactory = moduleRef.get(OrderFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[POST] /orders/:id/awaiting', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const recipient = await recipientFactory.makePrismaRecipient()

    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
    })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })
    const response = await request(app.getHttpServer())
      .post(`/orders/${order.id.toString()}/awaiting`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(201)
    expect(response.body.order.status).toBe('WAITING')
  })
})
