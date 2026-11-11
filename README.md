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
cd api
npm install
npm start
```

Em outro terminal, suba o front-end:

```bash
cd web
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
| `DB_FILE`        | `api/data.sqlite`           | Arquivo do banco |

Para zerar os dados, apague `api/data.sqlite`.

## Testes

**API** (47 testes, banco em memória):

```bash
cd api
npm test
```

**Front-end** (21 testes E2E com Playwright). Na primeira vez, instale o navegador de teste:

```bash
cd web
npx playwright install chromium
npm run test:e2e
```

O Playwright sobe sozinho uma API (porta 3100, banco em memória) e um front-end (porta 5174) só para os testes, então não mexe nos seus dados. Para assistir aos testes rodando: `npm run test:e2e:ui`.

| Arquivo | O que cobre |
|---------|-------------|
| `api/tests/users.test.js`      | Cadastro, login, token, `/me`, validações, 401 e 404 |
| `api/tests/categories.test.js` | CRUD de categorias, `/categories/:id/todos`, isolamento entre usuários |
| `api/tests/todos.test.js`      | CRUD de tarefas, filtros, validações, isolamento entre usuários |
| `web/e2e/auth.spec.ts`         | Login, cadastro, token guardado e enviado, sair, rota protegida |
| `web/e2e/todos.spec.ts`        | **CRUD inteiro de tarefas**: criar, listar, editar, concluir, filtrar, excluir |
| `web/e2e/categories.spec.ts`   | CRUD de categorias e tarefas de uma categoria |

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

Todas as requisições estão prontas em [api/requests.http](api/requests.http), para a extensão [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) do VS Code.

## Requisitos do trabalho

| Requisito | Onde está |
|-----------|-----------|
| Três recursos com relacionamento | `users`, `categories` e `todos`; rota `GET /categories/:id/todos` |
| Signup, login com JWT e rotas protegidas | [api/src/routes/users.js](api/src/routes/users.js) e [api/src/middleware/auth.js](api/src/middleware/auth.js) |
| Banco de dados | SQLite, em [api/src/db.js](api/src/db.js) |
| Tratamento de erros | [api/src/errors.js](api/src/errors.js) e [api/src/validation.js](api/src/validation.js) |
| Testes de todos os recursos da API | [api/tests](api/tests) |
| Tela de login que guarda e usa o token | [web/src/pages/LoginPage.tsx](web/src/pages/LoginPage.tsx), [web/src/lib/auth.tsx](web/src/lib/auth.tsx) e [web/src/lib/api.ts](web/src/lib/api.ts) |
| Framework de UI | Tailwind CSS com shadcn/ui |
| Layout consistente e responsivo | Cabeçalho com navegação e rodapé em [web/src/components/AppLayout.tsx](web/src/components/AppLayout.tsx) |
| Componente de terceiro (shadcn/ui) | [web/src/components/ui](web/src/components/ui): Dialog, Alert Dialog, Sheet, Select, Tabs, Checkbox, Progress, Dropdown Menu, Sonner e outros |
| Testes do front-end com CRUD inteiro | [web/e2e/todos.spec.ts](web/e2e/todos.spec.ts) |
| Página sobre os membros do grupo | Página **Sobre**; os nomes ficam em [web/src/data/members.ts](web/src/data/members.ts) |

## Estrutura

```
.
├── api/                    # API RESTful (Node.js + Express)
│   ├── src/
│   │   ├── server.js       # sobe o servidor
│   │   ├── app.js          # monta o Express e as rotas
│   │   ├── db.js           # conexão e tabelas do SQLite
│   │   ├── routes/         # users, categories, todos
│   │   ├── middleware/     # autenticação JWT
│   │   ├── validation.js   # validação dos dados de entrada
│   │   └── errors.js       # tratamento de erros
│   ├── tests/              # testes da API
│   └── requests.http       # requisições prontas
└── web/                    # front-end (React + Vite)
    ├── src/
    │   ├── pages/          # Login, Cadastro, Tarefas, Categorias, Sobre
    │   ├── components/     # layout, formulários e componentes shadcn/ui (ui/)
    │   ├── lib/            # cliente da API e autenticação
    │   └── data/           # membros do grupo
    └── e2e/                # testes Playwright
```

## Membros do grupo

- Arthur Dall Agnol Pinheiro ([@arthuurdp](https://github.com/arthuurdp))
