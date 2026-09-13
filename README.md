# distr-arch-todo-list

API RESTful de lista de tarefas com autenticação, controle de acesso por papéis (ADMIN/USER), API Gateway com rate limit e load balancer, e mensageria com RabbitMQ para envio de emails.

> Projeto em desenvolvimento. As seções marcadas como *planejado* ainda não foram implementadas.

## Opções escolhidas

- **(a) API Gateway com Rate Limit e Load Balancer** — nginx na frente de duas instâncias da API *(planejado)*
- **(b) Mensageria com RabbitMQ** — producer na API, consumer no notification-worker, filas `email.password-reset` e `email.welcome` *(planejado)*

## Stack

- Java 21, Spring Boot 4.1
- PostgreSQL 17 + Flyway
- Spring Security + JWT
- RabbitMQ
- nginx
- springdoc-openapi (Swagger UI)
- Docker Compose

## Arquitetura (alvo)

```mermaid
flowchart LR
  C[Cliente / Swagger UI] -->|:80| G[nginx<br/>rate limit + load balancer]
  G --> A1[api-1]
  G --> A2[api-2]
  A1 & A2 --> PG[(PostgreSQL)]
  A1 & A2 -->|publica| MQ[RabbitMQ]
  MQ -->|consome| W[notification-worker]
  W -->|SMTP| MP[Mailpit]
```

- Somente a `api` possui banco de dados. As instâncias `api-1` e `api-2` compartilham o mesmo banco, pois são réplicas do mesmo serviço.
- O `notification-worker` é stateless: consome mensagens e envia emails.
- O schema do banco é versionado pelo Flyway (`services/api/src/main/resources/db/migration`). O Hibernate roda com `ddl-auto: validate`: ele só confere se as entidades batem com o schema, nunca altera tabelas.

## Estrutura do repositório

```
.
├── docker-compose.yml
├── .env.example
├── pom.xml                         # Maven parent (multi-módulo)
├── infra/
│   └── postgres/Dockerfile
├── libs/
│   └── messaging-contracts/        # eventos e nomes de filas compartilhados
└── services/
    ├── api/                        # API REST, auth, RBAC, todos, producer
    │   └── Dockerfile
    └── notification-worker/        # consumer RabbitMQ, envio de emails
```

## Pré-requisitos

- Docker e Docker Compose
- Java 21 (apenas para rodar/compilar fora do Docker)

## Como executar

```bash
docker compose up -d --build
```

Não é necessário criar `.env`: o compose usa valores padrão. Para customizar, copie `.env.example` para `.env`.

Após subir, a API fica disponível em `http://localhost:8080` e a documentação em `http://localhost:8080/swagger-ui.html`.

Para parar e remover os volumes (apaga os dados do banco):

```bash
docker compose down -v
```

### Build e testes locais

```bash
./mvnw clean package -DskipTests
./mvnw verify   # requer Docker em execução (Testcontainers)
```

## Endpoints

| Método | Rota              | Descrição                                                   |
|--------|-------------------|-------------------------------------------------------------|
| GET    | `/api/todos`      | Lista paginada. Filtros: `completed`, `page`, `size`, `sort` |
| GET    | `/api/todos/{id}` | Busca uma tarefa                                            |
| POST   | `/api/todos`      | Cria uma tarefa (`201` + header `Location`)                 |
| PUT    | `/api/todos/{id}` | Atualiza uma tarefa                                         |
| DELETE | `/api/todos/{id}` | Remove uma tarefa (`204`)                                   |

Exemplo:

```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Estudar RabbitMQ", "description": "filas e exchanges", "dueDate": "2026-09-30"}'
```

Erros seguem o padrão [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) (`application/problem+json`).

## Portas

| Serviço    | Porta | Descrição                                   |
|------------|-------|---------------------------------------------|
| API        | 8080  | Acesso direto (substituído pelo nginx na fase 3) |
| PostgreSQL | 5432  | Banco de dados da `api`                     |

## Variáveis de ambiente

| Variável            | Padrão     | Descrição                    |
|---------------------|------------|------------------------------|
| `POSTGRES_DB`       | `todolist` | Nome do banco                |
| `POSTGRES_USER`     | `todolist` | Usuário do banco             |
| `POSTGRES_PASSWORD` | `todolist` | Senha do banco               |
| `POSTGRES_PORT`     | `5432`     | Porta do Postgres no host    |
| `API_PORT`          | `8080`     | Porta da API no host         |
