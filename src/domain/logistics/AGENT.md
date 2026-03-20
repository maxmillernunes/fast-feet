# LOGISTICS

Bounded Context de entregas.

## DOMÍNIO DE NEGÓCIO

| Entidade        | Descrição                 |
| --------------- | ------------------------- |
| **Order**       | Encomenda com status      |
| **Recipient**   | Destinatário da encomenda |
| **Deliveryman** | Entregador (futuro)       |

## CICLO DE VIDA DO PEDIDO

```
CREATED → WAITING → PICKED_UP → DELIVERED
                          ↓
                       RETURNED → WAITING
```

| Status      | Significado              |
| ----------- | ------------------------ |
| `CREATED`   | Pedido criado            |
| `WAITING`   | Aguardando coleta        |
| `PICKED_UP` | Coletado pelo entregador |
| `DELIVERED` | Entregue ao destinatário |
| `RETURNED`  | Retornou ao originador   |

## SUBCAMADAS

```
logistics/
├── application/     # Use Cases + Repositories
└── enterprise/     # Entities + VOs + Errors
```
