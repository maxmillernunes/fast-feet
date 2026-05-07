# E2E Tests - Single Test per Controller

## Objetivo

Criar testes e2e para controllers existentes usando o padrão de "um teste por arquivo", similar ao `upload-attachment.controller.e2e-spec.ts`.

## Problema

- Testes e2e são lentos (~17s para rodar todos)
- Cada execução recria o banco de dados via migration
- Necessidade de testes mais rápidos para debug/development

## Solução

Cada arquivo de teste e2e terá apenas 1 único teste (happy path).

## Arquivos a Criar

| Arquivo | Rota | Método |
|---------|------|--------|
| `register-delivery-driver.controller.e2e-spec.ts` | `/delivery-drivers` | POST |
| `fetch-delivery-drivers.controller.e2e-spec.ts` | `/delivery-drivers` | GET |
| `get-delivery-drivers.controller.e2e-spec.ts` | `/delivery-drivers/:id` | GET |
| `update-delivery-drivers.controller.e2e-spec.ts` | `/delivery-drivers/:id` | PUT |
| `delete-delivery-drivers.controller.e2e-spec.ts` | `/delivery-drivers/:id` | DELETE |

## Estrutura do Teste

```typescript
describe('Nome Controller (e2e)', () => {
  let app: INestApplication
  let jwt: JwtService
  let userFactory: UserFactory

  beforeAll(async () => {
    const { AppModule } = await import('@/infra/app.module.js')
    const { DatabaseModule } = await import('@/infra/database/database.module.js')

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    userFactory = moduleRef.get(UserFactory)

    await app.init()
  })

  test('[METHOD] /rota', async () => {
    // Arrange - criar usuário admin e driver
    // Act - fazer request com token
    // Assert - verificar response
  })
})
```

## Correções Necessárias

1. `create-account.controller.ts` - adicionar decorator `@Public()`
2. Testes existentes ajustar para funcionar corretamente

## Success Criteria

- 1 teste passando por arquivo
- Tempo de execução menor por arquivo individual
- Estrutura consistente com `upload-attachment.controller.e2e-spec.ts`