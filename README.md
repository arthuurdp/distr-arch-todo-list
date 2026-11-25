# Lista de Tarefas

Aplicação completa de lista de tarefas: uma **API RESTful em Node.js** com autenticação **JWT** e um **front-end em React** que consome essa API. Cada usuário cadastra as próprias tarefas, organiza em categorias, marca o que concluiu e acompanha os prazos.

## Tecnologias

| Parte          | Tecnologias |
|----------------|-------------|
| API            | Node.js, TypeScript, Express 5, JWT (`jsonwebtoken`), `bcryptjs`, Zod |
| Banco de dados | PostgreSQL 17, **Prisma** (ORM) e **Prisma Migrate** (migrations) |
| Front-end      | React 19, Vite, TypeScript, React Router, Tailwind CSS, **shadcn/ui** |
| Testes         | Vitest + Supertest + Testcontainers (API) e Playwright (front-end) |
| Infraestrutura | Docker, Docker Compose e nginx |

## Como rodar com Docker

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto.

```bash
docker compose up -d --build
```

Sobem três serviços: `postgres`, `backend` e `frontend`. O backend aplica as migrations sozinho ao iniciar.

| O quê      | Endereço |
|------------|----------|
| Aplicação  | http://localhost:5173 |
| API        | http://localhost:8080/api/v1 |
| Swagger    | http://localhost:8080/api/v1/docs |
| PostgreSQL | `localhost:5432`, banco, usuário e senha `todolist` |

Abra http://localhost:5173, crie uma conta em **Criar conta** e use a aplicação.

Para entrar com dados de exemplo, rode o seed (ver [Dados de exemplo](#dados-de-exemplo-seed)):

```bash
docker compose exec backend npm run db:seed:prod
```

```bash
docker compose down        # para os containers e mantém os dados
docker compose down -v     # para e APAGA os dados do banco
```

Para trocar portas ou senhas, copie `.env.example` para `.env` na raiz e edite.

## Como rodar em modo de desenvolvimento

**Pré-requisitos:** Node.js 22.13 ou superior e Docker (só para o banco).

Suba apenas o banco:

```bash
docker compose up -d postgres
```

Em um terminal, suba a API:

```bash
cd backend
cp .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

O `npm run db:seed` é opcional: cria o usuário de exemplo com categorias e tarefas.

Em outro terminal, suba o front-end:

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. O front-end chama `/api`, e o Vite repassa para a API na porta 8080.

### Variáveis da API (`backend/.env`)

| Variável         | Padrão no `.env.example`                                   | Descrição |
|------------------|------------------------------------------------------------|-----------|
| `DATABASE_URL`   | `postgresql://todolist:todolist@localhost:5432/todolist`   | Conexão com o PostgreSQL |
| `JWT_SECRET`     | chave de desenvolvimento                                   | Chave que assina os tokens |
| `JWT_EXPIRES_IN` | `15m`                                                      | Validade do access token |
| `REFRESH_TOKEN_DAYS` | `7`                                                    | Validade do refresh token, em dias |
| `COOKIE_SECURE`  | `false`                                                    | Use `true` quando a aplicação estiver em HTTPS |
| `PORT`           | `8080`                                                     | Porta da API |

## Banco de dados e migrations

As tabelas são descritas em [backend/prisma/schema.prisma](backend/prisma/schema.prisma). Cada mudança no schema vira um arquivo SQL versionado em [backend/prisma/migrations](backend/prisma/migrations), e o Prisma registra na tabela `_prisma_migrations` quais já foram aplicadas.

Comandos, dentro de `backend/`:

| Comando | O que faz |
|---------|-----------|
| `npm run db:migrate -- --name <nome>` | Cria uma migration a partir das mudanças no schema e aplica no banco de desenvolvimento |
| `npm run db:deploy`   | Aplica as migrations pendentes (usado no Docker e nos testes) |
| `npm run db:generate` | Gera de novo o Prisma Client (tipos e consultas) |
| `npm run db:seed`     | Cria ou recria os dados de exemplo (ver abaixo) |
| `npm run db:studio`   | Abre uma tela para ver e editar os dados |

### Dados de exemplo (seed)

O seed em [backend/src/seed.ts](backend/src/seed.ts) cria um usuário de exemplo:

| Email | Senha |
|-------|-------|
| `demo@todolist.com` | `Demo@12345` |

Com 4 categorias (Faculdade, Trabalho, Casa, Saúde) e 14 tarefas: umas concluídas, umas pendentes, algumas sem categoria, prazos vencidos e futuros. Os prazos são calculados a partir do dia em que o seed roda.

Pode rodar quantas vezes quiser: a cada execução, as tarefas e categorias do usuário de exemplo são apagadas e criadas de novo. Os dados de outros usuários não são tocados.

| Onde | Comando |
|------|---------|
| Desenvolvimento, dentro de `backend/` | `npm run db:seed` |
| Docker, com a stack no ar | `docker compose exec backend npm run db:seed:prod` |

## Testes

Os testes exigem o **Docker aberto**: cada execução sobe um PostgreSQL descartável com Testcontainers e aplica as migrations, então nada toca no banco de desenvolvimento.

**API** (83 testes):

```bash
cd backend
npm test
```

**Front-end** (40 testes E2E com Playwright). Na primeira vez, instale o navegador de teste:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

O Playwright sobe sozinho uma API (porta 3100, com banco descartável) e um front-end (porta 5174) só para os testes. Para assistir aos testes rodando: `npm run test:e2e:ui`.

| Arquivo | O que cobre |
|---------|-------------|
| `backend/tests/users.test.ts`      | Cadastro, login, token, `/me`, validações, 401 e 404 |
| `backend/tests/sessions.test.ts`   | Cookie do refresh token, renovação, rotação, reuso de token, logout |
| `backend/tests/categories.test.ts` | CRUD de categorias, `/categories/:id/todos`, isolamento entre usuários |
| `backend/tests/todos.test.ts`      | CRUD de tarefas, filtros, validações, isolamento entre usuários |
| `frontend/e2e/auth.spec.ts`        | Login, cadastro, token no cabeçalho, cookie httpOnly, renovação automática, sair, rota protegida |
| `frontend/e2e/todos.spec.ts`       | **CRUD inteiro de tarefas**: criar, listar, editar, concluir, filtrar, excluir |
| `frontend/e2e/categories.spec.ts`  | CRUD de categorias e tarefas de uma categoria |
| `frontend/e2e/theme.spec.ts`       | Modo escuro por padrão, troca para o claro e a escolha mantida ao recarregar |

## Rotas da API

Documentação interativa (Swagger UI): http://localhost:8080/api/v1/docs. Especificação OpenAPI em JSON: http://localhost:8080/api/v1/docs.json.

Para testar pelo Swagger: execute `POST /auth/login`, copie o `token`, clique em **Authorize** e cole.

Base: `http://localhost:8080/api/v1`. As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

### Versionamento

Todas as rotas ficam sob `/api/v1`. O prefixo é definido uma vez em [backend/src/config.ts](backend/src/config.ts) (`API_PREFIX`), e as rotas da versão são montadas num `Router` próprio em [backend/src/app.ts](backend/src/app.ts).

Para lançar uma versão nova sem quebrar quem usa a atual, cria-se outro `Router` e monta-se em `/api/v2`, com os controllers que mudaram. A `v1` continua no ar até os clientes migrarem. O health check (`/api/health`) fica fora da versão, porque é usado pela infraestrutura (Docker), não pelos clientes da API.

| Método | Rota                     | Acesso    | Descrição |
|--------|--------------------------|-----------|-----------|
| POST   | `/auth/register`         | Público   | Cadastro (signup). Retorna o usuário e o token |
| POST   | `/auth/login`            | Público   | Login. Retorna o token JWT |
| POST   | `/auth/refresh`          | Cookie    | Troca o refresh token do cookie por um novo access token |
| POST   | `/auth/logout`           | Cookie    | Revoga o refresh token e apaga o cookie |
| GET    | `/users/me`              | Protegida | Dados do usuário do token |
| GET    | `/categories`            | Protegida | Lista as categorias |
| POST   | `/categories`            | Protegida | Cria uma categoria |
| GET    | `/categories/:id`        | Protegida | Busca uma categoria |
| PUT    | `/categories/:id`        | Protegida | Renomeia uma categoria |
| DELETE | `/categories/:id`        | Protegida | Exclui uma categoria (as tarefas ficam sem categoria) |
| GET    | `/categories/:id/todos`  | Protegida | **Relacionamento:** tarefas da categoria |
| GET    | `/todos`                 | Protegida | Lista as tarefas, paginada. Filtros: `completed` (`true` ou `false`), `categoryId` (id ou `none`) e `dueBefore` (prazo antes da data, usado na aba Atrasadas). Paginação: `page` (a partir de 1) e `size` (padrão 10, máximo 50) |
| GET    | `/todos/summary`         | Protegida | Total de tarefas e quantas estão concluídas |
| POST   | `/todos`                 | Protegida | Cria uma tarefa |
| GET    | `/todos/:id`             | Protegida | Busca uma tarefa |
| PUT    | `/todos/:id`             | Protegida | Atualiza uma tarefa |
| DELETE | `/todos/:id`             | Protegida | Exclui uma tarefa |

### Autenticação

São dois tokens, cada um com um papel:

| Token | Formato | Validade | Onde fica no navegador | Como é enviado |
|-------|---------|----------|------------------------|----------------|
| Access token | JWT | 15 minutos | Só na memória da página | Cabeçalho `Authorization: Bearer <token>` |
| Refresh token | Texto aleatório | 7 dias | Cookie `httpOnly`, `SameSite=Strict`, restrito a `/api/v1/auth` | Automaticamente, pelo navegador |

- **Login e cadastro** devolvem o access token no corpo e o refresh token no cookie. O JavaScript da página não consegue ler esse cookie, então um script malicioso não tem como roubá-lo.
- **Renovação:** quando a página é aberta, ou quando a API responde `401`, o front-end chama `POST /auth/refresh`, recebe outro access token e repete a requisição.
- **Rotação:** cada renovação invalida o refresh token usado e emite um novo.
- **Revogação:** `POST /auth/logout` invalida o refresh token no banco (tabela `refresh_tokens`, que guarda só o hash). Se um refresh token já trocado for usado de novo, todas as sessões daquele usuário são encerradas.
- **Limite:** um access token já emitido vale até expirar; por isso a validade curta.

**Relacionamentos:** um usuário tem muitas categorias e muitas tarefas; uma categoria tem muitas tarefas. Cada usuário só enxerga os próprios dados: o recurso de outra pessoa responde `404`.

**Ordem das tarefas** (em `GET /todos` e `GET /categories/:id/todos`): pendentes antes das concluídas; em cada grupo, o prazo mais próximo primeiro (as vencidas aparecem no topo) e as tarefas sem prazo no fim. Em caso de empate, a mais nova vem antes.

**Erros** sempre em JSON, com mensagem para o cliente:

```json
{
  "error": "Dados inválidos",
  "details": { "title": "Título é obrigatório" }
}
```

| Status | Quando |
|--------|--------|
| 400 | Campos inválidos ou JSON mal formado |
| 401 | Sem token, token inválido ou expirado, sessão expirada, email ou senha incorretos |
| 404 | Recurso ou rota inexistente |
| 409 | Email ou nome de categoria já cadastrado |

Todas as requisições estão prontas em [backend/requests.http](backend/requests.http), para a extensão [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) do VS Code.

## Requisitos do trabalho

| Requisito | Onde está |
|-----------|-----------|
| Três recursos com relacionamento | `users`, `categories` e `todos`; rota `GET /categories/:id/todos` |
| Signup, login com JWT e rotas protegidas | [backend/src/services/auth.service.ts](backend/src/services/auth.service.ts), [backend/src/services/token.service.ts](backend/src/services/token.service.ts) e [backend/src/middlewares/auth.middleware.ts](backend/src/middlewares/auth.middleware.ts). O token vai no cabeçalho `Authorization`; ver [Autenticação](#autenticação) |
| Banco de dados | PostgreSQL com Prisma: [backend/prisma/schema.prisma](backend/prisma/schema.prisma) e [backend/src/repositories](backend/src/repositories) |
| Tratamento de erros | [backend/src/middlewares/error.middleware.ts](backend/src/middlewares/error.middleware.ts) e [backend/src/validators](backend/src/validators) |
| Testes de todos os recursos da API | [backend/tests](backend/tests) |
| Tela de login que guarda e usa o token | [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx), [frontend/src/lib/auth.tsx](frontend/src/lib/auth.tsx) e [frontend/src/api](frontend/src/api) (token em memória, cabeçalho e renovação) |
| Framework de UI | Tailwind CSS com shadcn/ui |
| Layout consistente e responsivo | Cabeçalho com navegação e rodapé em [frontend/src/components/AppLayout.tsx](frontend/src/components/AppLayout.tsx) |
| Componente de terceiro (shadcn/ui) | [frontend/src/components/ui](frontend/src/components/ui): Dialog, Alert Dialog, Sheet, Select, Tabs, Checkbox, Progress, Dropdown Menu, Pagination, Sonner e outros |
| Testes do front-end com CRUD inteiro | [frontend/e2e/todos.spec.ts](frontend/e2e/todos.spec.ts) |
| Página sobre os membros do grupo | Página **Sobre**; os nomes ficam em [frontend/src/data/members.ts](frontend/src/data/members.ts) |

## Arquitetura do backend

O backend segue o padrão em camadas **Controller → Service → Repository**, o mesmo usado em projetos Spring. Cada camada só conversa com a de baixo:

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| Routes | `routes/` | Liga cada URL e método HTTP a um método do controller |
| Controller | `controllers/` | Lê a requisição, valida os dados de entrada e devolve a resposta HTTP |
| Service | `services/` | Regras de negócio: email único, dono do recurso, senha, token |
| Repository | `repositories/` | Único lugar que fala com o banco, pelo Prisma Client |
| Model | `prisma/schema.prisma` | Entidades `User`, `Category` e `Todo`; o Prisma gera os tipos |
| DTO | `dtos/` | Formato das respostas e conversão entidade → resposta |
| Validators | `validators/` | Regras dos dados de entrada (Zod) |
| Middlewares | `middlewares/` | Autenticação JWT e tratamento de erros |

Os objetos são criados e ligados uns aos outros em [backend/src/app.ts](backend/src/app.ts) (injeção de dependência manual, pelo construtor).

## Estrutura

```
.
├── docker-compose.yml       # postgres + backend + frontend
├── backend/                 # API RESTful (Node.js + Express + TypeScript)
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma    # entidades e relacionamentos
│   │   └── migrations/      # migrations SQL versionadas
│   ├── src/
│   │   ├── server.ts        # sobe o servidor
│   │   ├── app.ts           # monta o Express e injeta as dependências
│   │   ├── config.ts        # variáveis de ambiente
│   │   ├── database.ts      # cria o Prisma Client
│   │   ├── errors.ts        # HttpError
│   │   ├── routes/          # user, category e todo
│   │   ├── controllers/     # entrada e saída HTTP
│   │   ├── services/        # regras de negócio e token JWT
│   │   ├── repositories/    # acesso ao banco
│   │   ├── dtos/            # formato das respostas
│   │   ├── validators/      # validação dos dados de entrada (Zod)
│   │   └── middlewares/     # autenticação JWT e tratamento de erros
│   ├── tests/               # testes da API
│   └── requests.http        # requisições prontas
└── frontend/                # front-end (React + Vite)
    ├── Dockerfile
    ├── nginx.conf           # serve o build e repassa /api para o backend
    ├── src/
    │   ├── pages/           # Login, Cadastro, Tarefas, Categorias, Sobre
    │   ├── components/      # layout, formulários e componentes shadcn/ui (ui/)
    │   ├── api/             # cliente axios, sessão (token e renovação) e erros
    │   ├── services/        # chamadas da API por recurso: auth, category, todo
    │   ├── types/           # tipos User, Category e Todo
    │   ├── lib/             # contexto de autenticação e utilitários
    │   └── data/            # membros do grupo
    └── e2e/                 # testes Playwright
    
```