# FAST FEET

Sistema de controle de entregas.

## STACK

- **Framework:** NestJS + TypeScript
- **Arquitetura:** DDD + Clean Architecture
- **ORM:** Prisma (futuro)
- **Testes:** Vitest

## ESTRUTURA

```
src/
├── core/           # Classes compartilhadas (Entity, Either, etc)
├── domain/         # Regras de negócio (bounded contexts)
└── infra/          # Técnico (controllers, database) - futuro
```

## REGRAS CRUZADAS

1. **Isolamento:** `core/` e `domain/` nunca importam de `infra/`
2. **Imports:** Use paths absolutos (`@/core/`, `@/domain/`)
3. **Fluxo:** Camadas externas conhecem internas, nunca o contrário

## PADRÃO DE NOME

| Tipo       | Arquivo              | Classe            |
| ---------- | -------------------- | ----------------- |
| Entity     | `entity-name.ts`     | `EntityName`      |
| Use Case   | `verb-noun.ts`       | `VerbNounUseCase` |
| Repository | `name-repository.ts` | `NameRepository`  |
| Error      | `name-error.ts`      | `NameError`       |

## ESCOPO ATUAL

Apenas `core/` e `domain/` estão sendo desenvolvidos.
