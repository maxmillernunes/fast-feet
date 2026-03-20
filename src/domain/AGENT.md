# DOMAIN

Bounded contexts de negócio.

## ESTRUTURA

```
src/domain/
└── [context]/           # Ex: logistics
    ├── application/     # Use Cases + Repositories
    └── enterprise/      # Entities + Value Objects
```

## CONCEITOS DDD

| Conceito           | Descrição                                |
| ------------------ | ---------------------------------------- |
| **Entity**         | Objeto com identidade de negócio         |
| **Value Object**   | Objeto imutável, comparado por valor     |
| **Aggregate Root** | Entity que controla acesso a um agregado |
| **Use Case**       | Operação de negócio encapsulada          |
| **Repository**     | Abstração de persistência                |
| **Domain Error**   | Erro específico do negócio               |

## ENTITY VS VALUE OBJECT

```
Entity:        → tem ID → Order, Recipient
Value Object:  → sem ID → Document, OrderStatus
```

## FLUXO TÍPICO

```
Controller → UseCase → Repository → (DB futuro)
                ↓
            Entity/VO
```

Use Case orquestra, Entity carrega regras.
