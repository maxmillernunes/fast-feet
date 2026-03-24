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
                           │
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

## COMPORTAMENTOS DO PEDIDO

O pedido (Order) tem métodos que controlam seu ciclo:

```typescript
order.markAsAwaiting() // CREATED → WAITING
order.pickUp(driverId) // WAITING → PICKED_UP
order.deliver(driverId) // PICKED_UP → DELIVERED
order.return(driverId) // PICKED_UP → RETURNED
```

Cada método:

- Valida se a transição é permitida
- Valida se o entregador é o correto
- Atualiza o status
- Registra timestamps (pickedAt, deliveredAt)

## VALIDAÇÕES IMPORTANTES

1. **Transição de status**
   - Cada status só pode transitar para status específicos
   - Tentar transição inválida retorna erro

2. **Proprietário do pedido**
   - Só o entregador que retirou pode entregar/devolver
   - `deliveryDriveId` é definido no `pickUp()`

3. **Edição de pedidos**
   - Pedidos podem ser editados enquanto `CREATED` ou `WAITING`
   - Após `PICKED_UP`, não pode mais editar
