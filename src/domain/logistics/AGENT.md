# LOGISTICS

Domínio de controle de entregas.

## O QUE É

Sistema de gestão de encomendas onde:

- Admin cadastra pedidos e destinatários
- Admin marca pedidos como "aguardando retirada"
- Entregador retira pedidos
- Entregador marca como entregue ou devolvido

## ENTIDADES DO DOMÍNIO

| Entidade        | Descrição    | Identidade |
| --------------- | ------------ | ---------- |
| **Order**       | Encomenda    | ID único   |
| **Recipient**   | Destinatário | ID único   |
| **Deliveryman** | Entregador   | (futuro)   |

## VALUE OBJECTS

| Value Object    | Descrição                                                           | Local                                                |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| **OrderStatus** | Status do pedido (CREATED, WAITING, PICKED_UP, DELIVERED, RETURNED) | `enterprise/entities/values-objects/order-status.ts` |

## CICLO DE VIDA DO PEDIDO

```
                    ┌──────────────┐
                    │   CREATED    │ ← Admin cria
                    └──────┬───────┘
                           │
                           ▼ (admin marca como awaiting)
                    ┌──────────────┐
                    │   WAITING    │ ← Aguardando retirada
                    └──────┬───────┘
                           │
                           ▼ (entregador retira)
                    ┌──────────────┐
                    │  PICKED_UP   │ ← Em rota
                    └──────┬───────┘
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   ┌────────────┐           ┌────────────┐
   │ DELIVERED  │           │  RETURNED  │ ← Não entregue
   └────────────┘           └──────┬─────┘
          (fim)                    │
                                   ▼ (tenta novamente)
                            ┌──────────────┐
                            │   WAITING    │
                            └──────────────┘
```

## STATUS DO PEDIDO

| Status      | Significado              | Quem muda  |
| ----------- | ------------------------ | ---------- |
| `CREATED`   | Pedido criado pelo admin | Admin      |
| `WAITING`   | Aguardando coleta        | Admin      |
| `PICKED_UP` | Coletado pelo entregador | Entregador |
| `DELIVERED` | Entregue ao destinatário | Entregador |
| `RETURNED`  | Retornou ao originador   | Entregador |

## PAPÉIS E PERMISSÕES

| Ação                     | Admin | Entregador |
| ------------------------ | ----- | ---------- |
| Criar pedido             | ✅    | ❌         |
| Marcar como WAITING      | ✅    | ❌         |
| Retirar pedido (PICK_UP) | ❌    | ✅         |
| Entregar (DELIVER)       | ❌    | ✅         |
| Devolver (RETURN)        | ❌    | ✅         |
| Ver pedidos próximos     | ✅    | ✅         |
| Ver próprios pedidos     | ❌    | ✅         |

## COMPORTAMENTOS PRINCIPAIS

A entidade Order possui métodos que controlam seu ciclo de vida:

| Método              | Transição             | Descrição                 |
| ------------------- | --------------------- | ------------------------- |
| `markAsAwaiting()`  | CREATED → WAITING     | Admin marca para retirada |
| `pickUp(driverId)`  | WAITING → PICKED_UP   | Entregador retira         |
| `deliver(driverId)` | PICKED_UP → DELIVERED | Entregador entrega        |
| `return(driverId)`  | PICKED_UP → RETURNED  | Não foi possível entregar |

Cada método:

- Valida se a transição de status é permitida
- Valida se o entregador é o correto (para deliver/return)
- Atualiza o status e registra timestamps relevantes

## VALIDAÇÕES IMPORTANTES

1. **Transição de status**
   - Cada status só pode transitar para status específicos
   - Transição inválida retorna erro

2. **Proprietário do pedido**
   - Só o entregador que retirou pode entregar ou devolver
   - Identificação do entregador é definida no momento do pickUp()

3. **Edição de pedidos**
   - Pedidos podem ser editados enquanto CREATED ou WAITING
   - Após PICKED_UP, não pode mais editar

---

## DETALHES IMPLEMENTAÇÃO

Para implementação, veja:

- [enterprise/AGENT.md](./enterprise/AGENT.md) → Entities, VOs, Errors
- [enterprise/events/AGENT.md](./enterprise/events/AGENT.md) → Domain Events
- [application/AGENT.md](./application/AGENT.md) → Use Cases, Repositories
