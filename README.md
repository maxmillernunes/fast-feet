# Fast Feet

## Sub-domains

### Logística e encomendas
É o coração do negócio.
- Responsabilidade: Gestão do ciclo de vida da encomenda, destinatários e regras de entrega/devolução.

#### Agregados:
- Order (Encomenda)
- Recipient (Destinatário)

#### Eventos: 
- OrderCreated
- OrderPickedUp
- OrderDelivered

### IAM
- Responsabilidade: Login, Gestão de Senhas, Perfis (Admin/Entregador) e Proteção de Rotas (RBAC).

#### Agregados:
- User (com Admin e DeliveryDriver como entidades especializadas ou roles).

### Notifications
Dá suporte ao Core, mas não é o foco principal. Ele apenas "ouve" e reage.

- Responsabilidade: Enviar e-mails, SMS ou Push Notifications para os destinatários.

### Agregados:
- Notification (Representa o registro de que um aviso foi enviado).