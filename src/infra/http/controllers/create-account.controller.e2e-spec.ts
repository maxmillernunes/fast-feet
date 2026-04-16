import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Create Account (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const { AppModule } = await import('@/app.module')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /accounts', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      document: '12345678909',
      password: 'password123',
    })

    expect(response.status).toBe(201)

    const userOnDatabase = await prisma.user.findFirst({
      where: {
        document: '12345678909',
      },
    })

    expect(userOnDatabase).toBeTruthy()
  })
})
