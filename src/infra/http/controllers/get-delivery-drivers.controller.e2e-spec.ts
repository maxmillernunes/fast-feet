import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'

describe('Get Delivery Driver (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } =
      await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)

    await app.init()
  })

  test('[GET] /delivery-drivers/:id', async () => {
  const admin = await userFactory.makePrismaUser({
    role: UserRole.ADMIN,
  })

  const driver = await userFactory.makePrismaUser({
    role: UserRole.DRIVER,
  })

  const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

  const response = await request(app.getHttpServer())
    .get(`/delivery-drivers/${driver.id.toString()}`)
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(200)
  expect(response.body).toEqual({
    driver: expect.objectContaining({
      id: driver.id.toString(),
    }),
  })
})
})