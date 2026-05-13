import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'
import { RecipientFactory } from '@test/factories/make-recipient'

describe('Register Order (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let userFactory: UserFactory
  let recipientFactory: RecipientFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, RecipientFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
  })

  test('[POST] /orders', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const recipient = await recipientFactory.makePrismaRecipient()

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipientId: recipient.id.toString() })

    expect(response.status).toBe(201)
    expect(response.body.order).toEqual(
      expect.objectContaining({ status: 'CREATED' }),
    )
  })

  test('[POST] /orders - 404 when recipient not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipientId: 'non-existing-id' })

    expect(response.status).toBe(404)
  })
})
