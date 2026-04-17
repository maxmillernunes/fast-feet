import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcrypt'

describe('Authenticate (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /sessions', async () => {
    await prisma.user.create({
      data: {
        name: 'John Doe',
        document: '12345678909',
        password: await hash('password123', 10),
      },
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      document: '12345678909',
      password: 'password123',
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      access_token: expect.any(String),
    })
  })
})
