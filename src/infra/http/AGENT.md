# HTTP

Controllers HTTP, Presenters e Pipes de validação.

## O QUE CONTÉM

```
http/
├── controllers/        # Endpoints da API
├── presenters/         # Transformação de resposta
└── pipes/             # Pipes de validação (Zod)
```

---

## CONTROLLERS

### Padrão de Controller

```typescript
import { Controller, Post, Body, Get, Param, ... } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { [UseCase] } from '@/domain/[module]/application/use-cases/[use-case]'
import { Public } from '@/infra/auth/public'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

const [action]BodySchema = z.object({
  [field]: z.string(),
  [anotherField]: z.string().email(),
})

const bodyValidationPipe = new ZodValidationPipe([action]BodySchema)
type [Action]BodySchema = z.infer<typeof [action]BodySchema>

@Controller('/[resource]')
export class [Resource]Controller {
  constructor(private [useCase]: [UseCase]) {}

  @Post()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Body(bodyValidationPipe) body: [Action]BodySchema) {
    const result = await this.[useCase].execute(body)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case [SomeError]:
          throw new BadRequestException(error.message)
        case [AnotherError]:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return { [data]: result.value.[data] }
  }
}
```

### Decoradores Importantes

| Decorador        | Uso                                    |
| ---------------- | -------------------------------------- |
| `@Controller()`  | Define rota base                       |
| `@Public()`      | Rota pública (sem auth)               |
| `@RequireRoles()`| Restringe por role (ADMIN/DRIVER)     |
| `@UseGuards()`   | Aplica guard (auth, roles)            |
| `@CurrentUser()` | Injeta usuário autenticado             |

### Mapeamento de Erros

```typescript
switch (error.constructor) {
  case ResourceNotFoundError:
    throw new NotFoundException(error.message)
  case InvalidDocumentError:
    throw new BadRequestException(error.message)
  case AccountAlreadyExistsError:
    throw new ConflictException(error.message)
  case NotAllowedError:
    throw new ForbiddenException(error.message)
  default:
    throw new BadRequestException(error.message)
}
```

---

## VALIDATION PIPES

### ZodValidationPipe

Valida o corpo da requisição usando Zod.

```typescript
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'

const createOrderSchema = z.object({
  recipientId: z.string().uuid(),
  description: z.string().min(1),
})

const bodyValidationPipe = new ZodValidationPipe(createOrderSchema)

@Controller('/orders')
export class OrderController {
  @Post()
  async handle(@Body(bodyValidationPipe) body: CreateOrderSchema) {
    // body já.validido com tipagem inferred
  }
}
```

### Transformações Úteis

```typescript
// Remover caracteres não numéricos do documento
.transform((v) => v.replace(/\D/g, ''))

// Validar comprimento
.refine((v) => v.length === 11, 'Document deve ter 11 dígitos')

// Validar dígitos repetidos
.refine((v) => !/^(.)\1{10}$/.test(v), 'Document inválido')

// Validação customizada (CPF - módulo 11)
.refine((v) => {
  // algoritmo de validação
}, 'Document inválido')
```

---

## PRESENTERS

Transforma entidades do domínio para resposta HTTP.

### Exemplo

```typescript
// src/infra/http/presenters/delivery-driver-presenter.ts
import { User } from '@/domain/iam/enterprise/entities/user'

export class DeliveryDriverPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      document: user.document.value,
      role: user.role.value,
      createdAt: user.createdAt.toISOString(),
    }
  }
}

// No controller
return {
  driver: DeliveryDriverPresenter.toHTTP(result.value.user),
}
```

---

## ESTRUTURA DE TESTES E2E

```
controllers/
├── [controller].ts
└── [controller].e2e-spec.ts
```

### Padrão de Teste E2E

```typescript
import { AppModule } from '@/infra/app.module'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('[Controller] (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = app.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({})
  })

  it('[action] should [expected behavior]', async () => {
    // Arrange
    const [data] = ...

    // Act
    const response = await request(app.getHttpServer())
      .post('/[endpoint]')
      .send(data)

    // Assert
    expect(response.status).toBe(201)
  })
})
```

---

## REGISTRO DE CONTROLLERS

Os controllers são registrados no módulo HTTP:

```typescript
// src/infra/http/http.module.ts
@Module({
  imports: [...],
  controllers: [
    AuthenticateController,
    RegisterDeliveryDriverController,
    FetchDeliveryDriversController,
    GetDeliveryDriverByIdController,
    UpdateDeliveryDriverController,
    DeleteDeliveryDriversController,
    UploadAttachmentController,
    ...
  ],
  providers: [...],
})
export class HttpModule {}
```