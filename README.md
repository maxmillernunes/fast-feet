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


## Instruções
Estrutura, regras e requisitos do projeto

Você será responsável por desenvolver a API (backend) da FastFeet (transportadora fictícia). Esta API gerenciará o cadastro de usuários (administradores e entregadores), o fluxo de encomendas e o registro de destinatários.

A API deve seguir um conjunto de funcionalidades e regras de negócio.

## Features

- [x] A aplicação deve ter dois tipos de usuário, entregador e/ou admin
- [x] Deve ser possível realizar login com CPF e Senha
- [x] Deve ser possível realizar o CRUD dos entregadores
- [x] Deve ser possível realizar o CRUD das encomendas
- [x] Deve ser possível realizar o CRUD dos destinatários
- [x] Deve ser possível marcar uma encomenda como aguardando (Disponível para retirada)
- [x] Deve ser possível retirar uma encomenda
- [x] Deve ser possível marcar uma encomenda como entregue
- [x] Deve ser possível marcar uma encomenda como devolvida
- [x] Deve ser possível listar as encomendas com endereços de entrega próximo ao local do entregador
- [x] Deve ser possível alterar a senha de um usuário
- [x] Deve ser possível listar as entregas de um usuário
- [x] Deve ser possível notificar o destinatário a cada alteração no status da encomenda

## RN
[] Somente usuário do tipo admin pode realizar operações de CRUD nas encomendas
[] Somente usuário do tipo admin pode realizar operações de CRUD dos entregadores
[] Somente usuário do tipo admin pode realizar operações de CRUD dos destinatários
[x] Para marcar uma encomenda como entregue é obrigatório o envio de uma foto
[x] Somente o entregador que retirou a encomenda pode marcar ela como entregue
[] Somente o admin pode alterar a senha de um usuário
[x] Não deve ser possível um entregador listar as encomendas de outro entregador

## Conceitos que pode praticar
Este desafio foi desenhado para que você possa exercitar e aprofundar seus conhecimentos em:

- `Arquitetura e Design`: Domain-Driven Design (DDD), Domain Events e Clean Architecture para criar um sistema robusto e escalável
- `Segurança`: Autenticação e Autorização baseada em papéis (Role-Based Access Control - RBAC) para proteger suas rotas
- `Qualidade de Código`: Implementação de testes unitários e de ponta a ponta (E2E) para garantir a confiabilidade da API
- `Integrações`: Simulação de integração com serviços externos (ex: serviço de notificação)