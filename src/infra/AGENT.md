# INFRASTRUCTURE

Camada de implementação das tecnologias externas.

## O QUE CONTÉM

```
infra/
├── app.module.ts      # Módulo raiz da aplicação
├── main.ts            # Entry point (NestFactory)
├── http/              # Controllers HTTP
├── database/          # Prisma e repositories
├── auth/              # JWT, Guards, Decorators
├── cryptography/      # Bcrypt, JWT Encrypter
├── storage/           # AWS S3
└── env/               # Environment variables
```

## FLUXO

```
HTTP Request
    ↓
[Controller] → Validate (Zod) → Parse
    ↓
[UseCase] (domain/)
    ↓
[Repository] (interface)
    ↓
[Prisma Repository] (implementação)
    ↓
Database (PostgreSQL)
```

## REGRA IMPORTANTE

A camada `infra/` implementa contratos definidos em `domain/` e `core/`.

- Domain pode importar de Infra apenas para `@Injectable()` (única exceção)
- Infra importa de Domain/Core
- Depends Inversion Principle (DIP)

---

## DETALHES POR MÓDULO

Para implementação específica, veja:

- [http/AGENT.md](./http/AGENT.md) → Controllers, Presenters, Pipes
- [database/AGENT.md](./database/AGENT.md) → Prisma, Repositories, Mappers
- [auth/AGENT.md](./auth/AGENT.md) → JWT, Guards, Decorators
- [cryptography/AGENT.md](./cryptography/AGENT.md) → Hash e Encryption
- [storage/AGENT.md](./storage/AGENT.md) → AWS S3 Storage
- [env/AGENT.md](./env/AGENT.md) → Environment Configuration