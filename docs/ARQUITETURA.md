# Arquitetura

Decisões de arquitetura do projeto e o motivo de cada uma.

## Sumário

- [Contexto e opções escolhidas](#contexto-e-opções-escolhidas)
- [Visão geral](#visão-geral)
- [Componentes](#componentes)
- [Modelo de dados](#modelo-de-dados)
- [Organização do código da API](#organização-do-código-da-api)
- [Decisões](#decisões)

---

## Contexto e opções escolhidas

O trabalho pede uma API REST com persistência, orquestrada com Docker, e **exatamente 2** de 3 opções de arquitetura distribuída.

| Opção | Escolhida | Justificativa |
|-------|-----------|---------------|
| (a) API Gateway com rate limit e load balancer | Sim | Demonstra escalabilidade horizontal (várias réplicas da API) e proteção contra abuso, e se conecta diretamente à escolha de JWT stateless |
| (b) Mensageria com RabbitMQ | Sim | Tem um caso de uso real no domínio: enviar emails (código de reset de senha, boas-vindas) de forma assíncrona, sem travar a requisição |
| (c) Telemetria com Loki | Não | As opções (a) e (b) mudam o comportamento da aplicação e se complementam; telemetria seria uma camada de observação sobre o que já existe |

---

## Visão geral

### Estado atual (fases 0 a 2)

```mermaid
flowchart LR
    C[Cliente<br/>Swagger UI / curl] -->|:8080<br/>JWT| A[api<br/>Spring Boot]
    A -->|JDBC| PG[(PostgreSQL)]
```

### Arquitetura alvo (após as fases 3 e 4)

```mermaid
flowchart LR
    C[Cliente] -->|:80| G[nginx<br/>rate limit + load balancer]
    G --> A1[api-1]
    G --> A2[api-2]
    A1 & A2 -->|JDBC| PG[(PostgreSQL)]
    A1 & A2 -->|publica eventos| MQ[RabbitMQ]
    MQ -->|email.password-reset<br/>email.welcome| W[notification-worker]
    W -->|SMTP| MP[Mailpit<br/>caixa de entrada de teste]
```

---

## Componentes

| Componente            | Responsabilidade | Status |
|-----------------------|------------------|--------|
| `api`                 | REST, autenticação, regras de negócio, persistência, publicação de eventos | Implementado (sem eventos ainda) |
| `postgres`            | Banco de dados da `api` | Implementado |
| `nginx`               | Porta de entrada única, rate limit, balanceamento entre `api-1` e `api-2` | Fase 3 |
| `rabbitmq`            | Broker de mensagens | Fase 4 |
| `notification-worker` | Consome eventos e envia emails | Fase 4 |
| `mailpit`             | Servidor SMTP falso com interface web, para ver os emails na demonstração | Fase 4 |

---

## Modelo de dados

```mermaid
erDiagram
    users ||--o{ todos : "possui"
    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK "minúsculo"
        VARCHAR password_hash "BCrypt"
        VARCHAR role "ADMIN | USER"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    todos {
        UUID id PK
        UUID user_id FK "ON DELETE CASCADE"
        VARCHAR title
        VARCHAR description
        BOOLEAN completed
        DATE due_date
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
```

### Migrations

| Versão | Arquivo | O que faz |
|--------|---------|-----------|
| V1 | `V1__create_todos.sql` | Cria `todos` |
| V2 | `V2__create_users.sql` | Cria `users`, com email único e `CHECK` no papel |
| V3 | `V3__seed_admin_user.sql` | Insere o administrador de desenvolvimento |
| V4 | `V4__add_owner_to_todos.sql` | Adiciona `user_id` em `todos`: atribui tarefas antigas ao admin, torna obrigatório, cria FK e índice |

A V4 mostra por que migrations incrementais importam: a coluna de dono foi adicionada a uma tabela que já podia ter dados, sem apagar nada.

---

## Organização do código da API

O código é organizado **por funcionalidade** (e não por tipo de classe), para que tudo relacionado a tarefas fique junto:

```
com.todolist.api
├── auth/                 cadastro, login, emissão de token
│   ├── AuthController
│   ├── AuthService
│   ├── TokenService
│   └── dto/
├── todo/                 tarefas
│   ├── TodoController    HTTP: rotas, status, validação de entrada
│   ├── TodoService       regras: dono, filtros, transações
│   ├── TodoRepository    acesso ao banco (Spring Data JPA)
│   ├── Todo              entidade
│   ├── dto/              contratos de entrada e saída da API
│   └── mapper/           conversão entidade -> DTO
├── user/                 usuários e administração
│   ├── AdminUserController
│   ├── UserService
│   ├── UserRepository
│   ├── User
│   ├── enums/Role
│   ├── dto/
│   └── mapper/
└── shared/               código usado por várias funcionalidades
    ├── config/           Security, JWT, OpenAPI
    ├── security/         usuário autenticado, conversão do token, 401/403
    ├── exception/        exceções de domínio e tratamento global
    └── web/              paginação e validação de ordenação
```

Fluxo de uma requisição: `Controller` → `Service` → `Repository` → banco, com `Mapper` convertendo a entidade em DTO na volta. Entidades JPA nunca são serializadas diretamente na resposta.

---

## Decisões

### 1. Monorepo com Maven multi-módulo

Um único repositório com um `pom.xml` pai e módulos para `api`, `notification-worker` e `libs/messaging-contracts`.

- **Por quê:** a `api` (producer) e o `notification-worker` (consumer) precisam concordar no formato das mensagens. O módulo `messaging-contracts` guarda esses eventos num só lugar, e um build único garante que os dois lados compilam contra a mesma versão.
- **Consequência:** os Dockerfiles usam a raiz do repositório como contexto de build, para enxergar o pom pai e as libs compartilhadas.

### 2. Só a `api` tem banco; as réplicas compartilham

- `api-1` e `api-2` são cópias do **mesmo** serviço, então precisam ver os mesmos dados. Bancos separados fariam um usuário cadastrado numa instância não existir na outra.
- O `notification-worker` é stateless (recebe mensagem, envia email) e não precisa de banco. "Banco por serviço" significa que um serviço não acessa as tabelas de outro, e não que todo serviço deve ter um.

### 3. Schema versionado com Flyway e Hibernate só validando

- O Flyway aplica as migrations SQL na inicialização e registra o que já rodou em `flyway_schema_history`.
- O Hibernate roda com `ddl-auto: validate`: confere se as entidades batem com as tabelas e **falha na inicialização** se não baterem, mas nunca altera o schema.
- **Por quê:** o schema fica explícito, revisável e reproduzível em qualquer máquina. Com `ddl-auto: update`, o Hibernate alteraria tabelas de forma implícita e não versionada.
- **Regra:** migration aplicada é imutável. Mudanças entram como uma nova versão (como a V4).
- **Várias réplicas:** o Flyway usa um lock no Postgres, então se `api-1` e `api-2` subirem juntas só uma aplica as migrations.

### 4. Autenticação com JWT stateless

Detalhado em [AUTENTICACAO.md](AUTENTICACAO.md). Resumo: sem sessão no servidor, qualquer réplica valida qualquer token usando o mesmo `JWT_SECRET`, o que permite o load balancer da fase 3 distribuir requisições livremente.

### 5. Rate limit no gateway, não na aplicação *(fase 3)*

- Se cada instância contasse requisições por conta própria, com 2 réplicas o limite efetivo seria o dobro do configurado.
- No nginx o limite é aplicado uma única vez, antes de a requisição chegar a qualquer instância, e requisições bloqueadas nem consomem recursos da API.
- As rotas de login e reset de senha terão um limite mais restrito, contra força bruta.

### 6. Emails assíncronos via RabbitMQ *(fase 4)*

- Enviar email dentro da requisição deixaria o usuário esperando o servidor SMTP e faria a requisição falhar se ele estivesse fora do ar.
- Com fila, a API publica o evento e responde na hora. O worker envia quando puder, e as mensagens ficam guardadas na fila se o worker estiver parado.
- Duas filas com propósitos distintos: `email.password-reset` e `email.welcome`, cada uma com fila de mensagens mortas (DLQ) para falhas.
- O evento só será publicado **depois do commit** da transação, para não enviar email de uma operação que foi desfeita.

### 7. Erros no padrão RFC 9457 (Problem Details)

- Todo erro, inclusive `401` e `403` gerados pelo Spring Security antes de chegar ao controller, sai no mesmo formato JSON (`title`, `status`, `detail`, `instance`).
- **Por quê:** o cliente trata erros de um único jeito, e o formato é um padrão da IETF suportado nativamente pelo Spring.

### 8. Paginação com contrato próprio e ordenação por lista permitida

- As listagens retornam um `PageResponse` próprio (`content`, `page`, `size`, `totalElements`, `totalPages`) em vez de serializar o objeto interno do Spring Data, cujo formato não é estável entre versões.
- `sort` só aceita campos explicitamente permitidos. Sem isso, um valor malformado chegava ao banco e gerava `500`, e seria possível ordenar por campos que o cliente não pode ler (ex.: `owner.passwordHash`) e deduzir valores pela ordem.

### 9. Recurso de outro usuário responde `404`

Responder `403` confirmaria que o id existe. Com `404`, a API não revela a existência de tarefas alheias.

### 10. DTOs e mappers explícitos

- Requisições e respostas usam `record`s próprios (`CreateTodoRequest`, `TodoResponse`...), nunca a entidade.
- **Por quê:** evita expor campos internos (como `passwordHash`), impede que o cliente altere campos que não deveria (como `role` no cadastro) e desacopla o contrato da API do schema do banco.
- A conversão fica em mappers dedicados (`TodoMapper`, `UserMapper`), mantendo os DTOs como dados puros.

### 11. Docker

| Prática | Motivo |
|---------|--------|
| Build multi-stage (JDK para compilar, JRE para rodar) | Imagem final menor e sem ferramentas de build |
| Imagens Alpine | Menor tamanho |
| Usuário não-root no container | Reduz impacto de uma eventual falha de segurança |
| Cache do Maven no build (`--mount=type=cache`) | Rebuilds bem mais rápidos |
| `healthcheck` em cada serviço + `depends_on: service_healthy` | A API só inicia quando o banco está pronto de fato, e não apenas com o container criado |
| Valores padrão para todas as variáveis | `docker compose up` funciona sem criar `.env`, como exige o enunciado |
| Um Dockerfile por componente, inclusive infraestrutura | Exigência do enunciado; também deixa explícita a versão de cada imagem |

### 12. Testes de integração com Testcontainers

- Os testes sobem um PostgreSQL real e descartável em vez de um banco em memória (H2).
- **Por quê:** as migrations, os tipos (`UUID`, `TIMESTAMPTZ`), as constraints e o `ON DELETE CASCADE` são testados exatamente como rodam em produção. Um H2 aceitaria SQL que o Postgres recusaria, e vice-versa.
- Os testes exercitam a API pela camada HTTP (MockMvc) com tokens JWT reais, cobrindo autenticação, autorização e regras de negócio de ponta a ponta.
