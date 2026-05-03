import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'

describe('Upload Attachment (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let driverFactory: UserFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    driverFactory = moduleRef.get(UserFactory)

    await app.init()
  })

  test('[POST] /attachments', async () => {
    const driver = await driverFactory.makePrismaUser()

    const token = jwt.sign({ sub: driver.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/attachments')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', './test/e2e/attachment-e2e-test.png')

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      attachmentId: expect.any(String),
    })
  })
})
