# Referência da API

Todos os exemplos de resposta abaixo foram capturados da API rodando via `docker compose up`.

## Sumário

- [Convenções](#convenções)
- [Autenticação](#autenticação)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [GET /api/auth/me](#get-apiauthme)
- [Tarefas](#tarefas)
  - [GET /api/todos](#get-apitodos)
  - [GET /api/todos/{id}](#get-apitodosid)
  - [POST /api/todos](#post-apitodos)
  - [PUT /api/todos/{id}](#put-apitodosid)
  - [DELETE /api/todos/{id}](#delete-apitodosid)
- [Administração de usuários](#administração-de-usuários)
  - [GET /api/admin/users](#get-apiadminusers)
  - [PATCH /api/admin/users/{id}/role](#patch-apiadminusersidrole)
  - [DELETE /api/admin/users/{id}](#delete-apiadminusersid)
- [Endpoints públicos de infraestrutura](#endpoints-públicos-de-infraestrutura)
- [Matriz de permissões](#matriz-de-permissões)
- [Erros](#erros)

---

## Convenções

| Item              | Regra |
|-------------------|-------|
| URL base          | `http://localhost:8080` (na fase 3, o nginx passa a ser a entrada) |
| Formato           | JSON (`Content-Type: application/json`) |
| Autenticação      | Header `Authorization: Bearer <accessToken>` |
| Identificadores   | UUID, ex.: `bd9a46ec-8849-49c2-8e39-5e82a1271e97` |
| Datas (`dueDate`) | `AAAA-MM-DD`, ex.: `2026-09-30` |
| Timestamps        | ISO-8601 em UTC, ex.: `2026-09-14T00:21:53.344083Z` |
| Campos extras     | Campos desconhecidos no corpo da requisição são ignorados |

### Paginação e ordenação

As listagens aceitam os parâmetros de query:

| Parâmetro | Padrão           | Descrição |
|-----------|------------------|-----------|
| `page`    | `0`              | Página, começando em 0 |
| `size`    | `20`             | Itens por página (máximo 100; valores maiores são reduzidos para 100) |
| `sort`    | `createdAt,desc` | `campo` ou `campo,asc` / `campo,desc`. Pode ser repetido: `sort=completed,asc&sort=dueDate,desc` |

Só é possível ordenar pelos campos de uma **lista permitida** (definida em cada endpoint). Qualquer outro valor responde `400`. Isso impede, por exemplo, ordenar por campos internos que o cliente não pode ler.

Formato de toda resposta paginada:

```json
{
  "content": [ ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

---

## Autenticação

### POST /api/auth/register

Cria uma conta nova. **Acesso:** público.

A conta é **sempre** criada com o papel `USER`, mesmo que o corpo envie `"role": "ADMIN"`. Só um administrador pode promover alguém.

**Corpo**

| Campo      | Tipo   | Obrigatório | Regras |
|------------|--------|-------------|--------|
| `name`     | string | sim | Até 100 caracteres |
| `email`    | string | sim | Formato de email, até 255 caracteres. Salvo em minúsculas e sem espaços nas pontas |
| `password` | string | sim | Entre 8 e 72 caracteres (72 é o limite do BCrypt) |

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@gmail.com", "password": "Password123!"}'
```

**Resposta `201 Created`**

```json
{
  "id": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
  "name": "Test",
  "email": "test@gmail.com",
  "role": "USER",
  "createdAt": "2026-09-14T00:21:52.304360Z"
}
```

O cadastro não retorna token. Em seguida, faça login.

**Erros**

| Status | Quando | Exemplo |
|--------|--------|---------|
| 400 | Campos inválidos | ver abaixo |
| 409 | Email já cadastrado (sem diferenciar maiúsculas) | `{"title": "Conflict", "status": 409, "detail": "Email is already registered", "instance": "/api/auth/register"}` |

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/auth/register",
  "errors": {
    "password": "size must be between 8 and 72",
    "email": "must be a well-formed email address",
    "name": "must not be blank"
  }
}
```

---

### POST /api/auth/login

Autentica e retorna o JWT. **Acesso:** público.

**Corpo**

| Campo      | Tipo   | Obrigatório | Regras |
|------------|--------|-------------|--------|
| `email`    | string | sim | Formato de email (não diferencia maiúsculas) |
| `password` | string | sim | Até 72 caracteres |

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@todolist.com", "password": "Admin@12345"}'
```

**Resposta `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0b2RvbGlzdC1hcGkiLCJzdWIi...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

| Campo         | Descrição |
|---------------|-----------|
| `accessToken` | O JWT, para enviar em `Authorization: Bearer <accessToken>` |
| `tokenType`   | Sempre `Bearer` |
| `expiresIn`   | Validade do token em segundos (3600 = 1 hora) |

**Erros**

| Status | Quando |
|--------|--------|
| 400 | Campos ausentes ou email mal formatado |
| 401 | Email inexistente **ou** senha incorreta. A resposta é idêntica nos dois casos, para não revelar quais emails estão cadastrados |

```json
{
  "title": "Invalid credentials",
  "status": 401,
  "detail": "Invalid email or password",
  "instance": "/api/auth/login"
}
```

---

### GET /api/auth/me

Retorna os dados do usuário dono do token. **Acesso:** autenticado.

```bash
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer $TOKEN"
```

**Resposta `200 OK`**

```json
{
  "id": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
  "name": "Test",
  "email": "test@gmail.com",
  "role": "USER",
  "createdAt": "2026-09-14T00:21:52.304360Z"
}
```

**Erros:** `401` sem token ou com token inválido/expirado; `404` se o usuário foi removido depois de o token ser emitido.

---

## Tarefas

Todas as rotas de tarefas exigem autenticação. O resultado depende do papel de quem chama:

| Papel   | Enxerga                    | Pode alterar e remover     |
|---------|----------------------------|----------------------------|
| `USER`  | Apenas as próprias tarefas | Apenas as próprias tarefas |
| `ADMIN` | As tarefas de todos        | As tarefas de todos        |

Quando um `USER` tenta acessar a tarefa de outra pessoa, a API responde **`404`** (e não `403`). Assim não dá para descobrir quais ids existem.

**Objeto `Todo`**

| Campo         | Tipo           | Descrição |
|---------------|----------------|-----------|
| `id`          | UUID           | Identificador |
| `ownerId`     | UUID           | Usuário dono da tarefa |
| `title`       | string         | Título |
| `description` | string ou null | Descrição |
| `completed`   | boolean        | Se foi concluída |
| `dueDate`     | date ou null   | Prazo (`AAAA-MM-DD`) |
| `createdAt`   | timestamp      | Criação |
| `updatedAt`   | timestamp      | Última alteração |

---

### GET /api/todos

Lista tarefas com paginação. **Acesso:** autenticado.

**Query**

| Parâmetro   | Tipo    | Descrição |
|-------------|---------|-----------|
| `completed` | boolean | Opcional. `true` só concluídas, `false` só pendentes, ausente para todas |
| `page`, `size`, `sort` | — | Ver [paginação](#paginação-e-ordenação). `sort` aceita: `title`, `completed`, `dueDate`, `createdAt`, `updatedAt` |

```bash
curl "http://localhost:8080/api/todos?completed=false&page=0&size=20&sort=dueDate,asc" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta `200 OK`**

```json
{
  "content": [
    {
      "id": "bd9a46ec-8849-49c2-8e39-5e82a1271e97",
      "ownerId": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
      "title": "Test todo",
      "description": "Test description",
      "completed": false,
      "dueDate": "2026-09-30",
      "createdAt": "2026-09-14T00:21:53.344083Z",
      "updatedAt": "2026-09-14T00:21:53.344083Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

**Erros:** `400` com `sort` fora da lista permitida ou `completed` inválido; `401` sem token.

```json
{
  "title": "Invalid sort property",
  "status": 400,
  "detail": "Cannot sort by 'owner.passwordHash'. Allowed properties: title, completed, dueDate, createdAt, updatedAt",
  "instance": "/api/todos"
}
```

---

### GET /api/todos/{id}

Busca uma tarefa. **Acesso:** autenticado (dono ou ADMIN).

```bash
curl http://localhost:8080/api/todos/bd9a46ec-8849-49c2-8e39-5e82a1271e97 \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta `200 OK`:** um objeto `Todo`.

**Erros**

| Status | Quando |
|--------|--------|
| 400 | `id` não é um UUID válido |
| 401 | Sem token |
| 404 | Tarefa não existe, ou pertence a outro usuário (para `USER`) |

```json
{
  "title": "Resource not found",
  "status": 404,
  "detail": "Todo 00000000-0000-0000-0000-000000000000 not found",
  "instance": "/api/todos/00000000-0000-0000-0000-000000000000"
}
```

---

### POST /api/todos

Cria uma tarefa. O dono é sempre o usuário do token. **Acesso:** autenticado.

**Corpo**

| Campo         | Tipo   | Obrigatório | Regras |
|---------------|--------|-------------|--------|
| `title`       | string | sim | Não pode ser vazio; até 120 caracteres |
| `description` | string | não | Até 1000 caracteres |
| `dueDate`     | date   | não | `AAAA-MM-DD` |

Toda tarefa nasce com `completed: false`.

```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test todo", "description": "Test description", "dueDate": "2026-09-30"}'
```

**Resposta `201 Created`**, com o header `Location` apontando para a nova tarefa:

```
Location: http://localhost:8080/api/todos/bd9a46ec-8849-49c2-8e39-5e82a1271e97
```

```json
{
  "id": "bd9a46ec-8849-49c2-8e39-5e82a1271e97",
  "ownerId": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
  "title": "Test todo",
  "description": "Test description",
  "completed": false,
  "dueDate": "2026-09-30",
  "createdAt": "2026-09-14T00:21:53.344083Z",
  "updatedAt": "2026-09-14T00:21:53.344083Z"
}
```

**Erros:** `400` validação ou JSON inválido; `401` sem token.

---

### PUT /api/todos/{id}

Substitui os dados de uma tarefa. **Acesso:** autenticado (dono ou ADMIN).

> `PUT` substitui a tarefa inteira. Um campo opcional omitido (`description`, `dueDate`) é gravado como `null`. Para manter o valor atual, envie-o de novo.

**Corpo**

| Campo         | Tipo    | Obrigatório | Regras |
|---------------|---------|-------------|--------|
| `title`       | string  | sim | Não pode ser vazio; até 120 caracteres |
| `description` | string  | não | Até 1000 caracteres |
| `completed`   | boolean | sim | `true` ou `false` |
| `dueDate`     | date    | não | `AAAA-MM-DD` |

```bash
curl -X PUT http://localhost:8080/api/todos/bd9a46ec-8849-49c2-8e39-5e82a1271e97 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test todo updated", "description": "Test description", "completed": true, "dueDate": "2026-09-30"}'
```

**Resposta `200 OK`**

```json
{
  "id": "bd9a46ec-8849-49c2-8e39-5e82a1271e97",
  "ownerId": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
  "title": "Test todo updated",
  "description": "Test description",
  "completed": true,
  "dueDate": "2026-09-30",
  "createdAt": "2026-09-14T00:21:53.344083Z",
  "updatedAt": "2026-09-14T00:21:53.884746Z"
}
```

**Erros:** `400` validação; `401` sem token; `404` inexistente ou de outro usuário.

---

### DELETE /api/todos/{id}

Remove uma tarefa. **Acesso:** autenticado (dono ou ADMIN).

```bash
curl -X DELETE http://localhost:8080/api/todos/bd9a46ec-8849-49c2-8e39-5e82a1271e97 \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta `204 No Content`**, sem corpo.

**Erros:** `401` sem token; `404` inexistente ou de outro usuário.

---

## Administração de usuários

Todas as rotas em `/api/admin/**` exigem papel **ADMIN**. Um `USER` autenticado recebe `403`:

```json
{
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to access this resource",
  "instance": "/api/admin/users"
}
```

---

### GET /api/admin/users

Lista usuários com paginação. **Acesso:** ADMIN.

`sort` aceita: `name`, `email`, `role`, `createdAt`.

```bash
curl "http://localhost:8080/api/admin/users?size=5&sort=email,asc" -H "Authorization: Bearer $TOKEN"
```

**Resposta `200 OK`**

```json
{
  "content": [
    {
      "id": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
      "name": "Test",
      "email": "test@gmail.com",
      "role": "USER",
      "createdAt": "2026-09-14T00:21:52.304360Z"
    },
    {
      "id": "25383800-817e-492b-a713-006ef30662bc",
      "name": "Administrator",
      "email": "admin@todolist.com",
      "role": "ADMIN",
      "createdAt": "2026-09-14T00:18:16.623321Z"
    }
  ],
  "page": 0,
  "size": 5,
  "totalElements": 2,
  "totalPages": 1
}
```

---

### PATCH /api/admin/users/{id}/role

Altera o papel de um usuário. **Acesso:** ADMIN.

**Corpo**

| Campo  | Tipo   | Obrigatório | Valores |
|--------|--------|-------------|---------|
| `role` | string | sim | `ADMIN` ou `USER` |

```bash
curl -X PATCH http://localhost:8080/api/admin/users/aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

**Resposta `200 OK`**

```json
{
  "id": "aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd",
  "name": "Test",
  "email": "test@gmail.com",
  "role": "ADMIN",
  "createdAt": "2026-09-14T00:21:52.304360Z"
}
```

> O novo papel vale a partir do **próximo login** do usuário. Tokens já emitidos continuam com o papel antigo até expirar. Ver [limitações](AUTENTICACAO.md#limitações-conhecidas).

**Erros**

| Status | Quando |
|--------|--------|
| 400 | `role` ausente ou com valor diferente de `ADMIN`/`USER` |
| 404 | Usuário não existe |
| 422 | O administrador tentou alterar o próprio papel |

```json
{
  "title": "Business rule violation",
  "status": 422,
  "detail": "Administrators cannot change their own role",
  "instance": "/api/admin/users/25383800-817e-492b-a713-006ef30662bc/role"
}
```

---

### DELETE /api/admin/users/{id}

Remove um usuário **e todas as tarefas dele** (`ON DELETE CASCADE` no banco). **Acesso:** ADMIN.

```bash
curl -X DELETE http://localhost:8080/api/admin/users/aa6a3ee3-a21d-4ffc-9420-88f95f34cbfd \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta `204 No Content`**, sem corpo.

**Erros:** `404` usuário não existe; `422` o administrador tentou remover a própria conta (`"Administrators cannot delete their own account"`).

As regras de não alterar nem remover a si mesmo garantem que sempre reste ao menos um administrador capaz de acessar essas rotas.

---

## Endpoints públicos de infraestrutura

| Rota                  | Descrição |
|-----------------------|-----------|
| `/swagger-ui.html`    | Swagger UI, para testar a API pelo navegador |
| `/v3/api-docs`        | Especificação OpenAPI em JSON (importável no Postman/Insomnia) |
| `/actuator/health`    | Saúde da aplicação, usada pelo healthcheck do Docker: `{"status": "UP"}` |

---

## Matriz de permissões

| Endpoint                          | Sem token | USER               | ADMIN |
|-----------------------------------|-----------|--------------------|-------|
| `POST /api/auth/register`         | sim       | sim                | sim   |
| `POST /api/auth/login`            | sim       | sim                | sim   |
| `GET /api/auth/me`                | 401       | sim                | sim   |
| `GET /api/todos`                  | 401       | só as próprias     | todas |
| `GET/PUT/DELETE /api/todos/{id}`  | 401       | só as próprias (senão 404) | todas |
| `POST /api/todos`                 | 401       | sim                | sim   |
| `/api/admin/**`                   | 401       | 403                | sim   |

---

## Erros

Todos os erros seguem o padrão [RFC 9457 – Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457), com `Content-Type: application/problem+json`.

| Campo      | Descrição |
|------------|-----------|
| `title`    | Resumo do tipo de erro |
| `status`   | Código HTTP |
| `detail`   | Explicação do caso específico |
| `instance` | Rota que gerou o erro |
| `errors`   | Só em erros de validação: mapa `campo -> mensagem` |

| Status | `title`                   | Quando |
|--------|---------------------------|--------|
| 400    | `Bad Request`             | Validação dos campos, JSON mal formado, UUID ou parâmetro com tipo inválido |
| 400    | `Invalid sort property`   | `sort` com campo fora da lista permitida |
| 401    | `Unauthorized`            | Sem token, token mal formado, assinatura inválida ou expirado |
| 401    | `Invalid credentials`     | Login com email ou senha incorretos |
| 403    | `Forbidden`               | Autenticado, mas o papel não tem acesso (ex.: `USER` em `/api/admin/**`) |
| 404    | `Resource not found`      | Recurso não existe ou pertence a outro usuário |
| 409    | `Conflict`                | Email já cadastrado |
| 422    | `Business rule violation` | Regra de negócio violada (ex.: admin alterando o próprio papel) |

As mensagens de validação (`errors`) vêm do Bean Validation e seguem o idioma da JVM: em inglês no container Docker, podendo sair em português ao rodar pela IDE numa máquina configurada em pt-BR.
