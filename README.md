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

---

### IAM
- Responsabilidade: Login, Gestão de Senhas, Perfis (Admin/Entregador) e Proteção de Rotas (RBAC).

#### Agregados:
- User (com Admin e DeliveryDriver como entidades especializadas ou roles).

---

### Notifications
Dá suporte ao Core, mas não é o foco principal. Ele apenas "ouve" e reage.

- Responsabilidade: Enviar e-mails, SMS ou Push Notifications para os destinatários.

### Agregados:
- Notification (Representa o registro de que um aviso foi enviado).

## Features

- [] A aplicação deve ter dois tipos de usuário, entregador e/ou admin
- [] Deve ser possível realizar login com CPF e Senha
- [] Deve ser possível realizar o CRUD dos entregadores
- [x] Deve ser possível realizar o CRUD das encomendas
- [x] Deve ser possível realizar o CRUD dos destinatários
- [x] Deve ser possível marcar uma encomenda como aguardando (Disponível para retirada)
- [x] Deve ser possível retirar uma encomenda
- [x] Deve ser possível marcar uma encomenda como entregue
- [x] Deve ser possível marcar uma encomenda como devolvida
- [x] Deve ser possível listar as encomendas com endereços de entrega próximo ao local do entregador
- [] Deve ser possível alterar a senha de um usuário
- [] Deve ser possível listar as entregas de um usuário
- [] Deve ser possível notificar o destinatário a cada alteração no status da encomenda