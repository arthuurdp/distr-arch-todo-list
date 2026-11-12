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
| Aplicação  | http://localhost:8080 |
| API        | http://localhost:3000/api |
| PostgreSQL | `localhost:5432`, banco, usuário e senha `todolist` |

Abra http://localhost:8080, crie uma conta em **Criar conta** e use a aplicação.

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
npm run dev
```

Em outro terminal, suba o front-end:

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. O front-end chama `/api`, e o Vite repassa para a API na porta 3000.

### Variáveis da API (`backend/.env`)

| Variável         | Padrão no `.env.example`                                   | Descrição |
|------------------|------------------------------------------------------------|-----------|
| `DATABASE_URL`   | `postgresql://todolist:todolist@localhost:5432/todolist`   | Conexão com o PostgreSQL |
| `JWT_SECRET`     | chave de desenvolvimento                                   | Chave que assina os tokens |
| `JWT_EXPIRES_IN` | `15m`                                                      | Validade do access token |
| `REFRESH_TOKEN_DAYS` | `7`                                                    | Validade do refresh token, em dias |
| `COOKIE_SECURE`  | `false`                                                    | Use `true` quando a aplicação estiver em HTTPS |
| `PORT`           | `3000`                                                     | Porta da API |

## Banco de dados e migrations

As tabelas são descritas em [backend/prisma/schema.prisma](backend/prisma/schema.prisma). Cada mudança no schema vira um arquivo SQL versionado em [backend/prisma/migrations](backend/prisma/migrations), e o Prisma registra na tabela `_prisma_migrations` quais já foram aplicadas.

Comandos, dentro de `backend/`:

| Comando | O que faz |
|---------|-----------|
| `npm run db:migrate -- --name <nome>` | Cria uma migration a partir das mudanças no schema e aplica no banco de desenvolvimento |
| `npm run db:deploy`   | Aplica as migrations pendentes (usado no Docker e nos testes) |
| `npm run db:generate` | Gera de novo o Prisma Client (tipos e consultas) |
| `npm run db:studio`   | Abre uma tela para ver e editar os dados |

## Testes

Os testes exigem o **Docker aberto**: cada execução sobe um PostgreSQL descartável com Testcontainers e aplica as migrations, então nada toca no banco de desenvolvimento.

**API** (61 testes):

```bash
cd backend
npm test
```

**Front-end** (24 testes E2E com Playwright). Na primeira vez, instale o navegador de teste:

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

## Rotas da API

Base: `http://localhost:3000/api`. As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota                     | Acesso    | Descrição |
|--------|--------------------------|-----------|-----------|
| POST   | `/users/register`        | Público   | Cadastro (signup). Retorna o usuário e o token |
| POST   | `/users/login`           | Público   | Login. Retorna o token JWT |
| POST   | `/users/refresh`         | Cookie    | Troca o refresh token do cookie por um novo access token |
| POST   | `/users/logout`          | Cookie    | Revoga o refresh token e apaga o cookie |
| GET    | `/users/me`              | Protegida | Dados do usuário do token |
| GET    | `/categories`            | Protegida | Lista as categorias |
| POST   | `/categories`            | Protegida | Cria uma categoria |
| GET    | `/categories/:id`        | Protegida | Busca uma categoria |
| PUT    | `/categories/:id`        | Protegida | Renomeia uma categoria |
| DELETE | `/categories/:id`        | Protegida | Exclui uma categoria (as tarefas ficam sem categoria) |
| GET    | `/categories/:id/todos`  | Protegida | **Relacionamento:** tarefas da categoria |
| GET    | `/todos`                 | Protegida | Lista as tarefas (filtros `completed` e `categoryId`) |
| POST   | `/todos`                 | Protegida | Cria uma tarefa |
| GET    | `/todos/:id`             | Protegida | Busca uma tarefa |
| PUT    | `/todos/:id`             | Protegida | Atualiza uma tarefa |
| DELETE | `/todos/:id`             | Protegida | Exclui uma tarefa |

### Autenticação

São dois tokens, cada um com um papel:

| Token | Formato | Validade | Onde fica no navegador | Como é enviado |
|-------|---------|----------|------------------------|----------------|
| Access token | JWT | 15 minutos | Só na memória da página | Cabeçalho `Authorization: Bearer <token>` |
| Refresh token | Texto aleatório | 7 dias | Cookie `httpOnly`, `SameSite=Strict`, restrito a `/api/users` | Automaticamente, pelo navegador |

- **Login e cadastro** devolvem o access token no corpo e o refresh token no cookie. O JavaScript da página não consegue ler esse cookie, então um script malicioso não tem como roubá-lo.
- **Renovação:** quando a página é aberta, ou quando a API responde `401`, o front-end chama `POST /users/refresh`, recebe outro access token e repete a requisição.
- **Rotação:** cada renovação invalida o refresh token usado e emite um novo.
- **Revogação:** `POST /users/logout` invalida o refresh token no banco (tabela `refresh_tokens`, que guarda só o hash). Se um refresh token já trocado for usado de novo, todas as sessões daquele usuário são encerradas.
- **Limite:** um access token já emitido vale até expirar; por isso a validade curta.

**Relacionamentos:** um usuário tem muitas categorias e muitas tarefas; uma categoria tem muitas tarefas. Cada usuário só enxerga os próprios dados: o recurso de outra pessoa responde `404`.

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
| Signup, login com JWT e rotas protegidas | [backend/src/services/user.service.ts](backend/src/services/user.service.ts), [backend/src/services/token.service.ts](backend/src/services/token.service.ts) e [backend/src/middlewares/auth.middleware.ts](backend/src/middlewares/auth.middleware.ts). O token vai no cabeçalho `Authorization`; ver [Autenticação](#autenticação) |
| Banco de dados | PostgreSQL com Prisma: [backend/prisma/schema.prisma](backend/prisma/schema.prisma) e [backend/src/repositories](backend/src/repositories) |
| Tratamento de erros | [backend/src/middlewares/error.middleware.ts](backend/src/middlewares/error.middleware.ts) e [backend/src/validators](backend/src/validators) |
| Testes de todos os recursos da API | [backend/tests](backend/tests) |
| Tela de login que guarda e usa o token | [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx), [frontend/src/lib/auth.tsx](frontend/src/lib/auth.tsx) e [frontend/src/lib/api.ts](frontend/src/lib/api.ts) |
| Framework de UI | Tailwind CSS com shadcn/ui |
| Layout consistente e responsivo | Cabeçalho com navegação e rodapé em [frontend/src/components/AppLayout.tsx](frontend/src/components/AppLayout.tsx) |
| Componente de terceiro (shadcn/ui) | [frontend/src/components/ui](frontend/src/components/ui): Dialog, Alert Dialog, Sheet, Select, Tabs, Checkbox, Progress, Dropdown Menu, Sonner e outros |
| Testes do front-end com CRUD inteiro | [frontend/e2e/todos.spec.ts](frontend/e2e/todos.spec.ts) |
| Página sobre os membros do grupo | Página **Sobre**; os nomes ficam em [frontend/src/data/members.ts](frontend/src/data/members.ts) |

## Arquitetura do backend

O backend segue o padrão em camadas **Controller → Service → Repository**, o mesmo usado em projetos Spring. Cada camada só conversa com a de baixo:

| Camada | Pasta | Responsabilidade | Equivalente no Spring |
|--------|-------|------------------|-----------------------|
| Routes | `routes/` | Liga cada URL e método HTTP a um método do controller | `@GetMapping`, `@PostMapping` |
| Controller | `controllers/` | Lê a requisição, valida os dados de entrada e devolve a resposta HTTP | `@RestController` |
| Service | `services/` | Regras de negócio: email único, dono do recurso, senha, token | `@Service` |
| Repository | `repositories/` | Único lugar que fala com o banco, pelo Prisma Client | `@Repository` |
| Model | `prisma/schema.prisma` | Entidades `User`, `Category` e `Todo`; o Prisma gera os tipos | `@Entity` |
| DTO | `dtos/` | Formato das respostas e conversão entidade → resposta | DTO + mapper |
| Validators | `validators/` | Regras dos dados de entrada (Zod) | Bean Validation |
| Middlewares | `middlewares/` | Autenticação JWT e tratamento de erros | filtro de segurança e `@ControllerAdvice` |

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
    │   ├── lib/             # cliente da API e autenticação
    │   └── data/            # membros do grupo
    └── e2e/                 # testes Playwright
```

## Membros do grupo

- Arthur Dall Agnol Pinheiro ([@arthuurdp](https://github.com/arthuurdp))
