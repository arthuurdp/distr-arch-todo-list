# distr-arch-todo-list

API REST de lista de tarefas com cadastro, login via **JWT** e controle de acesso por papéis (**ADMIN** / **USER**), construída como trabalho da disciplina de Arquitetura Distribuída.

A aplicação inteira sobe com um único comando (`docker compose up`), sem nenhum passo manual.

## Sumário

- [Status do projeto](#status-do-projeto)
- [Opções escolhidas do trabalho](#opções-escolhidas-do-trabalho)
- [Stack](#stack)
- [Início rápido](#início-rápido)
- [Primeiros passos com a API](#primeiros-passos-com-a-api)
- [Endpoints](#endpoints)
- [Configuração](#configuração)
- [Rodando a API fora do Docker](#rodando-a-api-fora-do-docker)
- [Testes](#testes)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Solução de problemas](#solução-de-problemas)
- [Documentação detalhada](#documentação-detalhada)

## Status do projeto

| Fase | Conteúdo                                                          | Status     |
|------|-------------------------------------------------------------------|------------|
| 0    | Monorepo Maven multi-módulo, PostgreSQL no Docker Compose         | Concluída  |
| 1    | CRUD de tarefas, migrations Flyway, Dockerfile da API             | Concluída  |
| 2    | Cadastro, login JWT e controle de acesso ADMIN/USER               | Concluída  |
| 3    | API Gateway nginx com rate limit e load balancer                  | Planejada  |
| 4    | RabbitMQ, notification-worker e reset de senha por email          | Planejada  |
| 5    | Documentação OpenAPI completa                                     | Planejada  |
| 6    | Ajustes finais e documentação de entrega                          | Planejada  |

## Opções escolhidas do trabalho

O enunciado pede exatamente 2 de 3 opções. Foram escolhidas:

- **(a) API Gateway com Rate Limit e Load Balancer**: nginx na frente de duas instâncias da API *(fase 3)*.
- **(b) Mensageria com RabbitMQ**: a API publica eventos e o `notification-worker` consome e envia emails, usando as filas `email.password-reset` (código de 6 dígitos para redefinir senha) e `email.welcome` *(fase 4)*.

## Stack

| Camada           | Tecnologia                                   |
|------------------|----------------------------------------------|
| Linguagem        | Java 21                                      |
| Framework        | Spring Boot 4.1 (Web MVC, Data JPA, Security) |
| Banco de dados   | PostgreSQL 17                                |
| Migrations       | Flyway                                       |
| Autenticação     | JWT (HS256) com Spring Security OAuth2 Resource Server |
| Documentação     | springdoc-openapi (Swagger UI)               |
| Testes           | JUnit 5, MockMvc, Testcontainers             |
| Infraestrutura   | Docker, Docker Compose                       |
| Planejado        | nginx, RabbitMQ, Mailpit                     |

## Início rápido

### 1. Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose) **em execução**
- Git

Java 21 só é necessário para compilar ou rodar os testes fora do Docker.

### 2. Clonar e subir

```bash
git clone git@github.com:arthuurdp/distr-arch-todo-list.git
cd distr-arch-todo-list
docker compose up -d --build
```

O primeiro build baixa as dependências Maven e as imagens base, então pode levar alguns minutos. Os próximos são bem mais rápidos.

### 3. Conferir se subiu

```bash
docker compose ps
```

Os dois serviços devem aparecer como `healthy`:

```
postgres | Up (healthy) | 0.0.0.0:5432->5432/tcp
api      | Up (healthy) | 0.0.0.0:8080->8080/tcp
```

### 4. Acessar

| O quê                  | URL                                         |
|------------------------|---------------------------------------------|
| Swagger UI             | http://localhost:8080/swagger-ui.html       |
| Especificação OpenAPI  | http://localhost:8080/v3/api-docs           |
| Health check           | http://localhost:8080/actuator/health       |
| Base da API            | http://localhost:8080/api                   |

### Parar

```bash
docker compose down        # para os containers e mantém os dados
docker compose down -v     # para e APAGA os dados do banco
```

## Primeiros passos com a API

Quase todas as rotas exigem um token. O fluxo é sempre:

1. Fazer login e receber o `accessToken`.
2. Enviar o token no header `Authorization: Bearer <accessToken>` em cada requisição.

### Usuário administrador de desenvolvimento

Criado automaticamente pela migration `V3__seed_admin_user.sql`:

| Email                | Senha         | Papel |
|----------------------|---------------|-------|
| `admin@todolist.com` | `Admin@12345` | ADMIN |

Para testar como `USER`, cadastre uma conta nova em `POST /api/auth/register`.

### Pelo Swagger UI

1. Abra http://localhost:8080/swagger-ui.html.
2. Em **auth-controller**, execute `POST /api/auth/login` com:
   ```json
   { "email": "admin@todolist.com", "password": "Admin@12345" }
   ```
3. Copie o valor de `accessToken` da resposta.
4. Clique em **Authorize** (cadeado no topo), cole **só o token**, sem a palavra `Bearer`, e confirme.
5. A partir daí, as requisições do Swagger já vão autenticadas. Teste `GET /api/todos`.

### Pelo terminal (Bash / Git Bash)

```bash
# 1. Login: guarda o token numa variável
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@todolist.com", "password": "Admin@12345"}' \
  | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')

# 2. Criar uma tarefa
curl -X POST http://localhost:8080/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test todo", "description": "Test description", "dueDate": "2026-09-30"}'

# 3. Listar as tarefas
curl http://localhost:8080/api/todos -H "Authorization: Bearer $TOKEN"
```

### Pelo PowerShell

No Windows PowerShell, `curl` é um apelido para `Invoke-WebRequest` e não aceita os parâmetros acima. Use `Invoke-RestMethod`:

```powershell
# 1. Login
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login `
  -ContentType "application/json" `
  -Body '{"email": "admin@todolist.com", "password": "Admin@12345"}'
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

# 2. Criar uma tarefa
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/todos -Headers $headers `
  -ContentType "application/json" `
  -Body '{"title": "Test todo", "description": "Test description", "dueDate": "2026-09-30"}'

# 3. Listar as tarefas
Invoke-RestMethod -Uri http://localhost:8080/api/todos -Headers $headers
```

### Pelo VS Code

O arquivo [http/api.http](http/api.http) tem todas as requisições prontas, com o token sendo reaproveitado automaticamente. Instale a extensão [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) e clique em **Send Request** acima de cada requisição.

## Endpoints

Referência completa, com corpo das requisições, validações, exemplos de resposta e erros: [docs/API.md](docs/API.md).

| Método | Rota                         | Acesso      | Descrição                                              |
|--------|------------------------------|-------------|--------------------------------------------------------|
| POST   | `/api/auth/register`         | Público     | Cria uma conta (sempre com papel `USER`)               |
| POST   | `/api/auth/login`            | Público     | Autentica e retorna o JWT                              |
| GET    | `/api/auth/me`               | Autenticado | Dados do usuário dono do token                         |
| GET    | `/api/todos`                 | Autenticado | Lista paginada (filtro `completed`, `page`, `size`, `sort`) |
| GET    | `/api/todos/{id}`            | Autenticado | Busca uma tarefa                                       |
| POST   | `/api/todos`                 | Autenticado | Cria uma tarefa                                        |
| PUT    | `/api/todos/{id}`            | Autenticado | Substitui os dados de uma tarefa                       |
| DELETE | `/api/todos/{id}`            | Autenticado | Remove uma tarefa                                      |
| GET    | `/api/admin/users`           | ADMIN       | Lista usuários                                         |
| PATCH  | `/api/admin/users/{id}/role` | ADMIN       | Altera o papel de um usuário                           |
| DELETE | `/api/admin/users/{id}`      | ADMIN       | Remove um usuário e todas as tarefas dele              |

**Quem vê o quê:**

- `USER` só enxerga e altera **as próprias** tarefas. A tarefa de outra pessoa responde `404`, como se não existisse.
- `ADMIN` enxerga e altera as tarefas de **todos** e gerencia usuários.

Como o JWT funciona nesta API (estrutura do token, validação, papéis e limitações): [docs/AUTENTICACAO.md](docs/AUTENTICACAO.md).

## Configuração

### Variáveis de ambiente

O `docker-compose.yml` já tem valores padrão para tudo, então **não é preciso criar `.env`**. Para customizar, copie o exemplo e edite:

```bash
cp .env.example .env
```

| Variável            | Padrão no compose                          | Descrição                                                |
|---------------------|--------------------------------------------|----------------------------------------------------------|
| `POSTGRES_DB`       | `todolist`                                 | Nome do banco                                            |
| `POSTGRES_USER`     | `todolist`                                 | Usuário do banco                                         |
| `POSTGRES_PASSWORD` | `todolist`                                 | Senha do banco                                           |
| `POSTGRES_PORT`     | `5432`                                     | Porta do Postgres exposta no host                        |
| `API_PORT`          | `8080`                                     | Porta da API exposta no host                             |
| `JWT_SECRET`        | `dev-only-jwt-secret-change-me-0123456789` | Chave que assina os tokens (mínimo 32 caracteres)        |

> As credenciais do banco só são aplicadas quando o volume é criado pela primeira vez. Se mudar `POSTGRES_USER` ou `POSTGRES_PASSWORD` depois, é preciso recriar o volume com `docker compose down -v`, o que apaga os dados.

### Gerando um `JWT_SECRET` seguro

O valor padrão serve apenas para desenvolvimento. Para gerar um aleatório:

```bash
openssl rand -base64 32
```

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Todas as instâncias da API precisam usar **o mesmo** valor. Senão, um token emitido por uma instância é recusado pela outra.

### Portas

| Serviço    | Porta no host | Observação                                              |
|------------|---------------|---------------------------------------------------------|
| API        | 8080          | Acesso direto; na fase 3 o nginx passa a ser a entrada |
| PostgreSQL | 5432          | Útil para inspecionar o banco (pgAdmin, DBeaver, psql) |

Para conectar um cliente de banco: host `127.0.0.1`, porta `5432`, banco/usuário/senha `todolist`.

## Rodando a API fora do Docker

Útil para depurar pela IDE.

```bash
docker compose stop api           # libera a porta 8080
docker compose up -d postgres     # garante o banco rodando
```

Depois rode a classe `com.todolist.api.ApiApplication` pela IDE. O `application.yaml` já aponta para `localhost:5432` com as credenciais padrão.

## Testes

```bash
./mvnw verify
```

Requer o Docker em execução. Os testes usam **Testcontainers**, que sobe um PostgreSQL e um RabbitMQ descartáveis, então nada é gravado no banco do compose.

| Classe                     | O que cobre                                                                  |
|----------------------------|------------------------------------------------------------------------------|
| `AuthControllerTests`      | Cadastro sempre como USER, email duplicado, validação, login, token em `/me`, mesma resposta para senha errada e email inexistente, login do admin semeado |
| `TodoControllerTests`      | CRUD, filtro e paginação, 401 sem token ou com token inválido, isolamento entre usuários, visão do ADMIN, `sort` fora da lista permitida |
| `AdminUserControllerTests` | 403 para USER, listagem, troca de papel, remoção em cascata, admin não altera nem remove a si mesmo |

Para rodar só uma classe:

```bash
./mvnw -pl services/api verify -Dtest=TodoControllerTests
```

## Estrutura do repositório

```
.
├── docker-compose.yml              # sobe toda a aplicação
├── .env.example                    # exemplo de variáveis de ambiente
├── pom.xml                         # Maven parent (multi-módulo)
├── docs/
│   ├── API.md                      # referência dos endpoints
│   ├── AUTENTICACAO.md             # JWT, papéis e segurança
│   └── ARQUITETURA.md              # decisões de arquitetura
├── http/
│   └── api.http                    # requisições prontas (VS Code REST Client)
├── infra/
│   └── postgres/Dockerfile
├── libs/
│   └── messaging-contracts/        # eventos compartilhados entre api e worker (fase 4)
└── services/
    ├── api/
    │   ├── Dockerfile
    │   └── src/main/java/com/todolist/api/
    │       ├── auth/               # cadastro, login, emissão de token
    │       ├── todo/               # tarefas
    │       ├── user/               # usuários e endpoints de admin
    │       └── shared/             # segurança, configs, erros, paginação
    └── notification-worker/        # consumer RabbitMQ (fase 4)
```

## Solução de problemas

| Sintoma | Causa e solução |
|---------|-----------------|
| `failed to connect to the docker API` | O Docker Desktop não está aberto. Abra-o e aguarde ficar pronto. |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Outro Postgres (ou outro container) já usa a porta. Crie um `.env` com `POSTGRES_PORT=5433` (ou `API_PORT=8081` se o conflito for na 8080). |
| Container `api` fica `unhealthy` | Veja o motivo com `docker compose logs api`. |
| `Migration checksum mismatch` nos logs | Uma migration já aplicada foi alterada. Migrations são imutáveis; em ambiente de desenvolvimento, recrie o banco com `docker compose down -v` (apaga os dados). |
| `401 Unauthorized` com token | O token expirou (validade de 1h), foi copiado incompleto, ou foi colado com `Bearer` duplicado no Swagger. Faça login de novo. |
| `403 Forbidden` depois de virar ADMIN | O papel fica gravado dentro do token. Faça login de novo para receber um token com o papel atualizado. |
| pgAdmin recusa a senha correta | Use `127.0.0.1` em vez de `localhost` como host. |
| `curl` falha no PowerShell | Use `curl.exe` ou os exemplos com `Invoke-RestMethod` acima. |

## Documentação detalhada

- [docs/API.md](docs/API.md): referência de todos os endpoints, com exemplos reais de requisição e resposta.
- [docs/AUTENTICACAO.md](docs/AUTENTICACAO.md): como o JWT é emitido e validado, papéis, proteções e limitações.
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): decisões de arquitetura e justificativas.
