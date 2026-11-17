const json = (schema: object) => ({ 'application/json': { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const list = (name: string) => ({ type: 'array', items: ref(name) });

const error = (description: string, example: object) => ({
  description,
  content: { 'application/json': { schema: ref('Error'), example } },
});

const unauthorized = error('Sem token, ou token inválido ou expirado', {
  error: 'Token inválido ou expirado',
});
const validation = error('Dados inválidos', {
  error: 'Dados inválidos',
  details: { title: 'Título é obrigatório' },
});
const notFound = (resource: string) =>
  error(`${resource} não encontrada`, { error: `${resource} não encontrada` });

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

const sessionResponse = (description: string) => ({
  description,
  headers: {
    'Set-Cookie': {
      description: 'Cookie `refresh_token` (httpOnly, SameSite=Strict, Path=/api/users)',
      schema: { type: 'string' },
    },
  },
  content: json(ref('AuthResponse')),
});

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Lista de Tarefas API',
    version: '1.0.0',
    description:
      'API RESTful de tarefas com autenticação JWT.\n\n' +
      '**Como testar aqui:** execute `POST /users/login`, copie o `token` da resposta, ' +
      'clique em **Authorize** e cole o token. As rotas com cadeado passam a enviar ' +
      '`Authorization: Bearer <token>`.\n\n' +
      'O access token vale 15 minutos. O refresh token fica em cookie httpOnly e é usado ' +
      'por `POST /users/refresh`.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Usuários', description: 'Cadastro, login e sessão' },
    { name: 'Categorias', description: 'Categorias do usuário autenticado' },
    { name: 'Tarefas', description: 'Tarefas do usuário autenticado' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          details: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Ana Teste' },
          email: { type: 'string', format: 'email', example: 'ana@teste.com' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Access token JWT', example: 'eyJhbGciOi...' },
          user: ref('User'),
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100, example: 'Ana Teste' },
          email: { type: 'string', format: 'email', example: 'ana@teste.com' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'Senha@123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana@teste.com' },
          password: { type: 'string', example: 'Senha@123' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Faculdade' },
          todoCount: { type: 'integer', example: 2 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, example: 'Faculdade' },
        },
      },
      TodoPage: {
        type: 'object',
        required: ['content', 'page', 'size', 'totalElements', 'totalPages'],
        properties: {
          content: { ...list('Todo'), description: 'Tarefas desta página' },
          page: { type: 'integer', example: 1, description: 'Página atual, começando em 1' },
          size: { type: 'integer', example: 10, description: 'Itens por página' },
          totalElements: {
            type: 'integer',
            example: 14,
            description: 'Total de tarefas que atendem aos filtros',
          },
          totalPages: {
            type: 'integer',
            example: 2,
            description: 'Total de páginas; 0 quando não há tarefas',
          },
        },
      },
      Todo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Entregar o trabalho de React' },
          description: { type: 'string', nullable: true, example: 'Zip no Moodle' },
          completed: { type: 'boolean', example: false },
          dueDate: { type: 'string', format: 'date', nullable: true, example: '2026-12-01' },
          categoryId: { type: 'integer', nullable: true, example: 1 },
          category: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Faculdade' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTodoInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 120,
            example: 'Entregar o trabalho de React',
          },
          description: { type: 'string', maxLength: 1000, nullable: true, example: 'Zip no Moodle' },
          dueDate: { type: 'string', format: 'date', nullable: true, example: '2026-12-01' },
          categoryId: { type: 'integer', nullable: true, example: null },
        },
      },
      UpdateTodoInput: {
        type: 'object',
        required: ['title', 'completed'],
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 120,
            example: 'Entregar o trabalho de React',
          },
          description: { type: 'string', maxLength: 1000, nullable: true, example: 'Enviado' },
          dueDate: { type: 'string', format: 'date', nullable: true, example: '2026-12-01' },
          categoryId: { type: 'integer', nullable: true, example: null },
          completed: { type: 'boolean', example: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/users/register': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastro (signup)',
        security: [],
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          201: sessionResponse('Usuário criado e sessão iniciada'),
          400: validation,
          409: error('Email já cadastrado', { error: 'Email já cadastrado' }),
        },
      },
    },
    '/users/login': {
      post: {
        tags: ['Usuários'],
        summary: 'Login',
        description: 'Retorna o access token JWT e grava o refresh token em cookie.',
        security: [],
        requestBody: { required: true, content: json(ref('LoginInput')) },
        responses: {
          200: sessionResponse('Sessão iniciada'),
          400: validation,
          401: error('Credenciais incorretas', { error: 'Email ou senha incorretos' }),
        },
      },
    },
    '/users/refresh': {
      post: {
        tags: ['Usuários'],
        summary: 'Renova a sessão',
        description:
          'Troca o refresh token do cookie por um novo access token. O refresh token usado ' +
          'é invalidado e outro é emitido (rotação).',
        security: [{ refreshCookie: [] }],
        responses: {
          200: sessionResponse('Novo access token e novo refresh token'),
          401: error('Cookie ausente, expirado ou revogado', {
            error: 'Sessão expirada. Entre novamente.',
          }),
        },
      },
    },
    '/users/logout': {
      post: {
        tags: ['Usuários'],
        summary: 'Sair',
        description: 'Revoga o refresh token no banco e apaga o cookie.',
        security: [{ refreshCookie: [] }],
        responses: { 204: { description: 'Sessão encerrada' } },
      },
    },
    '/users/me': {
      get: {
        tags: ['Usuários'],
        summary: 'Usuário autenticado',
        responses: {
          200: { description: 'Dados do usuário do token', content: json(ref('User')) },
          401: unauthorized,
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categorias'],
        summary: 'Lista as categorias',
        responses: {
          200: { description: 'Categorias em ordem alfabética', content: json(list('Category')) },
          401: unauthorized,
        },
      },
      post: {
        tags: ['Categorias'],
        summary: 'Cria uma categoria',
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          201: { description: 'Categoria criada', content: json(ref('Category')) },
          400: validation,
          401: unauthorized,
          409: error('Nome repetido', { error: 'Já existe uma categoria com esse nome' }),
        },
      },
    },
    '/categories/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Categorias'],
        summary: 'Busca uma categoria',
        responses: {
          200: { description: 'Categoria', content: json(ref('Category')) },
          401: unauthorized,
          404: notFound('Categoria'),
        },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Renomeia uma categoria',
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          200: { description: 'Categoria atualizada', content: json(ref('Category')) },
          400: validation,
          401: unauthorized,
          404: notFound('Categoria'),
          409: error('Nome repetido', { error: 'Já existe uma categoria com esse nome' }),
        },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Exclui uma categoria',
        description: 'As tarefas da categoria continuam existindo, sem categoria.',
        responses: {
          204: { description: 'Categoria excluída' },
          401: unauthorized,
          404: notFound('Categoria'),
        },
      },
    },
    '/categories/{id}/todos': {
      parameters: [idParam],
      get: {
        tags: ['Categorias'],
        summary: 'Tarefas de uma categoria (relacionamento)',
        responses: {
          200: {
            description: 'Tarefas da categoria, na mesma ordem de GET /todos',
            content: json(list('Todo')),
          },
          401: unauthorized,
          404: notFound('Categoria'),
        },
      },
    },
    '/todos': {
      get: {
        tags: ['Tarefas'],
        summary: 'Lista as tarefas (paginada)',
        description:
          'Devolve uma página de tarefas. Ordem: pendentes antes das concluídas; ' +
          'em cada grupo, o prazo mais próximo (ou já vencido) primeiro e as sem prazo no fim. ' +
          'Os filtros e a paginação podem ser combinados, por exemplo ' +
          '`?completed=false&categoryId=1&page=2&size=5`. ' +
          'Uma página depois da última devolve `content` vazio, com os totais.',
        parameters: [
          {
            name: 'completed',
            in: 'query',
            description: 'Filtra por situação',
            schema: { type: 'boolean' },
          },
          {
            name: 'categoryId',
            in: 'query',
            description: 'Filtra por categoria. Use `none` para tarefas sem categoria',
            schema: { type: 'string', pattern: '^(none|[1-9]\\d*)$', example: 'none' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Página, começando em 1',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'size',
            in: 'query',
            description: 'Itens por página',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Página de tarefas: pendentes por prazo mais próximo, concluídas no fim',
            content: json(ref('TodoPage')),
          },
          400: error('Filtro ou paginação inválidos', {
            error: 'Dados inválidos',
            details: {
              completed: 'Use true ou false',
              page: 'Página inválida',
              size: 'Tamanho de página deve ser no máximo 50',
            },
          }),
          401: unauthorized,
        },
      },
      post: {
        tags: ['Tarefas'],
        summary: 'Cria uma tarefa',
        requestBody: { required: true, content: json(ref('CreateTodoInput')) },
        responses: {
          201: { description: 'Tarefa criada', content: json(ref('Todo')) },
          400: validation,
          401: unauthorized,
        },
      },
    },
    '/todos/summary': {
      get: {
        tags: ['Tarefas'],
        summary: 'Totais de tarefas',
        description: 'Total de tarefas do usuário e quantas estão concluídas.',
        responses: {
          200: {
            description: 'Totais',
            content: json({
              type: 'object',
              properties: {
                total: { type: 'integer', example: 5 },
                completed: { type: 'integer', example: 2 },
              },
            }),
          },
          401: unauthorized,
        },
      },
    },
    '/todos/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Tarefas'],
        summary: 'Busca uma tarefa',
        responses: {
          200: { description: 'Tarefa', content: json(ref('Todo')) },
          401: unauthorized,
          404: notFound('Tarefa'),
        },
      },
      put: {
        tags: ['Tarefas'],
        summary: 'Atualiza uma tarefa',
        description: 'Substitui todos os campos. Campos opcionais omitidos ficam vazios.',
        requestBody: { required: true, content: json(ref('UpdateTodoInput')) },
        responses: {
          200: { description: 'Tarefa atualizada', content: json(ref('Todo')) },
          400: validation,
          401: unauthorized,
          404: notFound('Tarefa'),
        },
      },
      delete: {
        tags: ['Tarefas'],
        summary: 'Exclui uma tarefa',
        responses: {
          204: { description: 'Tarefa excluída' },
          401: unauthorized,
          404: notFound('Tarefa'),
        },
      },
    },
  },
};
