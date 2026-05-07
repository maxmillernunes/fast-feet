import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import { JwtService } from '@nestjs/jwt'
import { UserFactory } from '@test/factories/make-user'
import { UserRole } from '@/domain/iam/enterprise/entities/user'

describe('Register Delivery Driver (e2e)', () => {
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

  test('[POST] /delivery-drivers', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
    })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/delivery-drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Driver',
        email: 'driver@example.com',
        document: '00000000191',
        password: 'Password123!',
      })

    expect(response.status).toBe(201)
  })

  test('[POST] /delivery-drivers should return 400 when document is invalid', async () => {
    const admin = await userFactory.makePrismaUser({
      role: UserRole.ADMIN,
    })

    const token = jwt.sign({ sub: admin.id.toString() }, { expiresIn: '1d' })

    const response = await request(app.getHttpServer())
      .post('/delivery-drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Driver',
        email: 'driver@example.com',
        document: '00000000000',
        password: 'Password123!',
      })

    expect(response.status).toBe(400)
  })

  

  test('[POST] /delivery-drivers should return 401 when not authenticated', async () => {
    const response = await request(app.getHttpServer())
      .post('/delivery-drivers')
      .send({
        name: 'John Driver',
        email: 'driver@example.com',
        document: '00000000191',
        password: 'Password123!',
      })

    expect(response.status).toBe(401)
  })
})