# Lista de Tarefas

Aplicação completa de lista de tarefas: uma **API RESTful em Node.js** com autenticação **JWT** e um **front-end em React** que consome essa API. Cada usuário cadastra as próprias tarefas, organiza em categorias, marca o que concluiu e acompanha os prazos.

## Tecnologias

| Parte      | Tecnologias |
|------------|-------------|
| API        | Node.js, Express 5, SQLite (`node:sqlite`), JWT (`jsonwebtoken`), `bcryptjs`, Zod |
| Front-end  | React 19, Vite, TypeScript, React Router, Tailwind CSS, **shadcn/ui** |
| Testes     | Vitest + Supertest (API) e Playwright (front-end) |

## Como rodar

**Pré-requisito:** Node.js 22.13 ou superior. O banco SQLite é criado sozinho, sem instalar nada.

Em um terminal, suba a API:

```bash
cd backend
npm install
npm start
```

Em outro terminal, suba o front-end:

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173, crie uma conta em **Criar conta** e use a aplicação.

| O quê     | Endereço |
|-----------|----------|
| Front-end | http://localhost:5173 |
| API       | http://localhost:3000/api |

O front-end chama `/api`, e o Vite repassa para a API na porta 3000.

### Configuração opcional da API

| Variável         | Padrão                      | Descrição |
|------------------|-----------------------------|-----------|
| `PORT`           | `3000`                      | Porta da API |
| `JWT_SECRET`     | chave de desenvolvimento    | Chave que assina os tokens |
| `JWT_EXPIRES_IN` | `8h`                        | Validade do token |
| `DB_FILE`        | `backend/data.sqlite`           | Arquivo do banco |

Para zerar os dados, apague `backend/data.sqlite`.

## Testes

**API** (48 testes, banco em memória):

```bash
cd backend
npm test
```

**Front-end** (21 testes E2E com Playwright). Na primeira vez, instale o navegador de teste:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

O Playwright sobe sozinho uma API (porta 3100, banco em memória) e um front-end (porta 5174) só para os testes, então não mexe nos seus dados. Para assistir aos testes rodando: `npm run test:e2e:ui`.

| Arquivo | O que cobre |
|---------|-------------|
| `backend/tests/users.test.js`      | Cadastro, login, token, `/me`, validações, 401 e 404 |
| `backend/tests/categories.test.js` | CRUD de categorias, `/categories/:id/todos`, isolamento entre usuários |
| `backend/tests/todos.test.js`      | CRUD de tarefas, filtros, validações, isolamento entre usuários |
| `frontend/e2e/auth.spec.ts`         | Login, cadastro, token guardado e enviado, sair, rota protegida |
| `frontend/e2e/todos.spec.ts`        | **CRUD inteiro de tarefas**: criar, listar, editar, concluir, filtrar, excluir |
| `frontend/e2e/categories.spec.ts`   | CRUD de categorias e tarefas de uma categoria |

## Rotas da API

Base: `http://localhost:3000/api`. As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota                     | Acesso    | Descrição |
|--------|--------------------------|-----------|-----------|
| POST   | `/users/register`        | Público   | Cadastro (signup). Retorna o usuário e o token |
| POST   | `/users/login`           | Público   | Login. Retorna o token JWT |
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
| 401 | Sem token, token inválido ou expirado, email ou senha incorretos |
| 404 | Recurso ou rota inexistente |
| 409 | Email ou nome de categoria já cadastrado |

Todas as requisições estão prontas em [backend/requests.http](backend/requests.http), para a extensão [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) do VS Code.

## Requisitos do trabalho

| Requisito | Onde está |
|-----------|-----------|
| Três recursos com relacionamento | `users`, `categories` e `todos`; rota `GET /categories/:id/todos` |
| Signup, login com JWT e rotas protegidas | [backend/src/services/user.service.js](backend/src/services/user.service.js), [backend/src/services/token.service.js](backend/src/services/token.service.js) e [backend/src/middlewares/auth.middleware.js](backend/src/middlewares/auth.middleware.js) |
| Banco de dados | SQLite, em [backend/src/database.js](backend/src/database.js) e [backend/src/repositories](backend/src/repositories) |
| Tratamento de erros | [backend/src/middlewares/error.middleware.js](backend/src/middlewares/error.middleware.js) e [backend/src/validators](backend/src/validators) |
| Testes de todos os recursos da API | [backend/tests](backend/tests) |
| Tela de login que guarda e usa o token | [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx), [frontend/src/lib/auth.tsx](frontend/src/lib/auth.tsx) e [frontend/src/lib/api.ts](frontend/src/lib/api.ts) |
| Framework de UI | Tailwind CSS com shadcn/ui |
| Layout consistente e responsivo | Cabeçalho com navegação e rodapé em [frontend/src/components/AppLayout.tsx](frontend/src/components/AppLayout.tsx) |
| Componente de terceiro (shadcn/ui) | [frontend/src/components/ui](frontend/src/components/ui): Dialog, Alert Dialog, Sheet, Select, Tabs, Checkbox, Progress, Dropdown Menu, Sonner e outros |
| Testes do front-end com CRUD inteiro | [frontend/e2e/todos.spec.ts](frontend/e2e/todos.spec.ts) |
| Página sobre os membros do grupo | Página **Sobre**; os nomes ficam em [frontend/src/data/members.ts](frontend/src/data/members.ts) |

## Arquitetura do backend

O backend segue o padrão em camadas **Controller → Service → Repository → Model**, o mesmo usado em projetos Spring. Cada camada só conversa com a de baixo:

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| Routes | `routes/` | Liga cada URL e método HTTP a um método do controller |
| Controller | `controllers/` | Lê a requisição, valida os dados de entrada e devolve a resposta HTTP |
| Service | `services/` | Regras de negócio: email único, dono do recurso, senha, token |
| Repository | `repositories/` | Único lugar com SQL; devolve models |
| Model | `models/` | Entidades `User`, `Category` e `Todo` |

Os objetos são criados e ligados uns aos outros em [backend/src/app.js](backend/src/app.js) (injeção de dependência manual, pelo construtor).

## Estrutura

```
.
├── backend/                 # API RESTful (Node.js + Express)
│   ├── src/
│   │   ├── server.js        # sobe o servidor
│   │   ├── app.js           # monta o Express e injeta as dependências
│   │   ├── config.js        # porta, chave JWT e arquivo do banco
│   │   ├── database.js      # conexão e tabelas do SQLite
│   │   ├── errors.js        # HttpError
│   │   ├── routes/          # user, category e todo
│   │   ├── controllers/     # entrada e saída HTTP
│   │   ├── services/        # regras de negócio e token JWT
│   │   ├── repositories/    # acesso ao banco
│   │   ├── models/          # User, Category e Todo
│   │   ├── validators/      # validação dos dados de entrada (Zod)
│   │   └── middlewares/     # autenticação JWT e tratamento de erros
│   ├── tests/               # testes da API
│   └── requests.http        # requisições prontas
└── frontend/                # front-end (React + Vite)
    ├── src/
    │   ├── pages/           # Login, Cadastro, Tarefas, Categorias, Sobre
    │   ├── components/      # layout, formulários e componentes shadcn/ui (ui/)
    │   ├── lib/             # cliente da API e autenticação
    │   └── data/            # membros do grupo
    └── e2e/                 # testes Playwright
```

## Membros do grupo

- Arthur Dall Agnol Pinheiro ([@arthuurdp](https://github.com/arthuurdp))
