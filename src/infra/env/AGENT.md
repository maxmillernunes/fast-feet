# ENVIRONMENT

Configuração de variáveis de ambiente.

## O QUE CONTÉM

```
env/
├── env.module.ts    # Module de configuração
├── env.service.ts   # Service de leitura
└── env.ts           # Schema de validação
```

---

## ENV SERVICE

```typescript
// src/infra/env/env.service.ts
@Injectable()
export class EnvService {
  get<T>(key: string): T {
    return this.configService.get<T>(key)!
  }
}
```

---

## SCHEMA DE VALIDAÇÃO

```typescript
// src/infra/env/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  // AWS
  AWS_REGION: z.string(),
  AWS_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_BUCKET: z.string(),
})

export const env = envSchema.parse(process.env)
```

---

## VARIÁVEIS POR CATEGORIA

### Database

| Variável        | Descrição                    |
| --------------- | ---------------------------- |
| `DATABASE_URL`  | URL de conexão PostgreSQL    |

### JWT

| Variável          | Descrição                    |
| ----------------- | ---------------------------- |
| `JWT_PRIVATE_KEY` | Chave privada RSA (base64)  |
| `JWT_PUBLIC_KEY` | Chave pública RSA (base64)  |

### AWS S3

| Variável               | Descrição                      |
| ---------------------- | ------------------------------ |
| `AWS_REGION`           | Região AWS (ex: us-east-1)   |
| `AWS_ENDPOINT`        | Endpoint (opcional para AWS) |
| `AWS_ACCESS_KEY_ID`   | Access Key ID                 |
| `AWS_SECRET_ACCESS_KEY`| Secret Access Key            |
| `AWS_S3_BUCKET`       | Nome do bucket                |

### App

| Variável    | Descrição                       |
| ----------- | --------------------------------|
| `NODE_ENV`  | Ambiente (dev/test/prod)       |
| `PORT`      | Porta do servidor (padrão 3000)|

---

## ENV MODULE

```typescript
// src/infra/env/env.module.ts
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
```

### isGlobal: true

Disponibiliza `EnvService` em todos os módulos sem necessidade de import.

---

## USO

```typescript
// Em qualquer serviço
constructor(private envService: EnvService) {}

async onModuleInit() {
  const dbUrl = this.envService.get<string>('DATABASE_URL')
  const port = this.envService.get<number>('PORT')
}
```

---

## VALIDAÇÃO

Ao iniciar a aplicação, o schema é validado. Se alguma variável obrigatória estiver faltando, o app não inicia.

```
Error: Invalid environment variables:
- DATABASE_URL: Required
- JWT_PRIVATE_KEY: Required
```