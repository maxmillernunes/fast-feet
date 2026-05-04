# AUTH

JWT, Guards, Decorators e Estratégias de autenticação.

## O QUE CONTÉM

```
auth/
├── auth.module.ts          # Module de configuração
├── jwt.strategy.ts         # Validação JWT (RS256)
├── jwt-auth.guard.ts       # Guard de autenticação
├── public.ts               # Decorator para rotas públicas
├── current-user-decorator.ts # Decorator @CurrentUser
└── permission-user-decorator.ts # Guard @RequireRoles
```

---

## FLUXO DE AUTENTICAÇÃO

```
1. Usuário faz login → recebe token JWT
2. Requisição com Authorization: Bearer <token>
3. JwtAuthGuard valida token
4. JwtStrategy extrai payload
5. @CurrentUser injeta dados do usuário
6. RequireRoles verifica role (se aplicável)
```

---

## JWT STRATEGY

Valida o token JWT usando chave pública RSA.

```typescript
// src/infra/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(envService: EnvService) {
    const publicKey = envService.get('JWT_PUBLIC_KEY')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    })
  }

  validate(payload: UserPayload) {
    return tokenPayloadSchema.parse(payload)
  }
}
```

### Payload do Token

```typescript
type UserPayload = {
  sub: string // User ID
  // ...outros campos
}
```

---

## GUARDS

### JwtAuthGuard

 Protege rotas exigindo autenticação.

```typescript
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

@Controller('/protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {}
```

### RequireRoles

 Protege rotas exigindo role específica.

```typescript
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

@Controller('/admin')
@UseGuards(RequireRoles('ADMIN'))
export class AdminController {}
```

#### Múltiplas roles

```typescript
@UseGuards(RequireRoles('ADMIN', 'DRIVER'))
```

#### Combinar guards

```typescript
@UseGuards(JwtAuthGuard, RequireRoles('ADMIN'))
```

---

## DECORATORS

### @Public()

Marca rota como pública (sem autenticação).

```typescript
import { Public } from '@/infra/auth/public'

@Controller('/auth')
@Public()
export class AuthController {
  @Post('/login')
  async login() { ... }
}
```

### @CurrentUser()

Injeta o usuário autenticado na rota.

```typescript
import { CurrentUser } from '@/infra/auth/current-user-decorator'

@Controller('/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    // user.sub contém o ID do usuário
  }
}
```

---

## AUTH MODULE

```typescript
// src/infra/auth/auth.module.ts
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    EnvService,
  ],
  exports: [
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
```

### Configuração

O módulo de auth depende de variáveis de ambiente:

| Variável         | Descrição                    |
| ---------------- | ---------------------------- |
| `JWT_PUBLIC_KEY` | Chave pública RSA (base64)  |
| `JWT_PRIVATE_KEY`| Chave privada RSA (base64)   |

---

## IMPLEMENTAÇÃO DO LOGIN

### Controller

```typescript
@Controller('/sessions')
@Public()
export class AuthenticateController {
  constructor(private authenticate: AuthenticateUseCase) {}

  @Post()
  async handle(@Body(bodyValidationPipe) body: AuthenticateBodySchema) {
    const result = await this.authenticate.execute(body)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { access_token } = result.value
    return { access_token }
  }
}
```

### Use Case (Authenticate)

Retorna JWT token após validar credenciais:

```typescript
// src/domain/iam/application/use-cases/authenticate.ts
type Response = Either<
  WrongCredentialsError | ResourceNotFoundError,
  { access_token: string }
>
```

### Payload do Token

O token JWT contém:
- `sub`: ID do usuário
- `iat`: Issued at
- `exp`: Expiration

---

## REGRA DE IMPORTAÇÃO

Nunca importe a camada `domain` em `infra/auth`.

- Auth usa JWT, não conhece regras de negócio
- Tokens são apenas credenciais de acesso
- Validação de permissões via Roles, não via domínio