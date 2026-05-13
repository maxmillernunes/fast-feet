import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'
import { OrderFactory } from '@test/factories/make-order'
import { RecipientFactory } from '@test/factories/make-recipient'

describe('Delete Order (e2e)', () => {
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

  test('[DELETE] /orders/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const recipient = await recipientFactory.makePrismaRecipient()
    const order = await orderFactory.makePrismaOrder({
      recipientId: recipient.id,
    })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .delete(`/orders/${order.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)

    const persisted = await prisma.order.findUnique({
      where: { id: order.id.toString() },
    })
    expect(persisted?.deletedAt).not.toBeNull()
  })

  test('[DELETE] /orders/:id - 404 when not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .delete('/orders/non-existing-id')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
  })
})
