import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'
import { RecipientFactory } from '@test/factories/make-recipient'

describe('Get Recipient (e2e)', () => {
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

  test('[GET] /recipients/:id', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const recipient = await recipientFactory.makePrismaRecipient({
      name: 'John Doe',
    })

    const response = await request(app.getHttpServer())
      .get(`/recipients/${recipient.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.recipient).toEqual(
      expect.objectContaining({ name: 'John Doe' }),
    )
  })

  test('[GET] /recipients/:id - 404 when not found', async () => {
    const admin = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })
    const response = await request(app.getHttpServer())
      .get('/recipients/non-existing-id')
      .set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(404)
  })
})
