# NOTIFICATION

Domínio de notificações e eventos de domínio.

## O QUE É

Sistema de envio e gerenciamento de notificações para os usuários, baseado em eventos de outros domínios.

- Envia notificações quando eventos de outros domínios ocorrem
- Gerencia leitura de notificações pelos destinatários
- Usa domain events para desacoplamento entre subdomínios

## ENTIDADES DO DOMÍNIO

| Entidade     | Descrição                        | Identidade |
| ------------ | -------------------------------- | ---------- |
| **[Entity]** | Notificação enviada a um usuário | ID único   |

## CONCEITOS-CHAVE

### Domain Events

- Eventos emitidos por outros domínios
- Subscribers recebem eventos e disparam ações
- Handlers processam eventos e decidem se enviam notificação
- Usa `DomainEvents.register()` para inscrever handlers

### Subscribers

- Classes que escutam eventos e disparam ações
- Cada subscriber escuta um ou mais eventos
- Inscreve handlers no `DomainEvents` no construtor

### Notifications

- Entidade com status de leitura
- Read-once: recipient lê uma vez, depois fica marcado como lido
- Não há edição após criação

## FLUXO PRINCIPAL

```
┌─────────────────┐        ┌─────────────────┐
│   [SOURCE]      │        │   NOTIFICATION  │
│   DOMAIN        │        │   DOMAIN        │
└────────┬────────┘        └─────────────────┘
         │                            │
         │ emit event                 │
         │[Entity]Event─────────────▶ │
         │                            │
         │                            │ dispatch
         │                            │
         │                            │ register handler
         │                            │
         │                            │ handler checks
         │                            │ [related entity] exists
         │                            │
         │                            │ sendNotification
         │                            │
         │                            │ create [Entity]
         │                            │
         │                            │ persist
         │                            │
         │                            │ handler ends
         │                            │
```

## STATUS/ESTADOS POSSÍVEIS

| Status   | When          | Significado            |
| -------- | ------------- | ---------------------- |
| `unread` | Default       | Notificação foi criada |
| `read`   | Após `read()` | Destinatário leu       |

## VALIDAÇÕES IMPORTANTES

1. **Read-once**
   - Notificação só pode ser lida uma vez
   - Após `read()`, `readAt` fica definido

2. **Permissão**
   - Só o destinatário da notificação pode lê-la
   - Validação em `Read[Entity]UseCase`

3. **Domain Events**
   - Só envia notificação se entidade relacionada existe
   - Handlers verificam antes de chamar use case
