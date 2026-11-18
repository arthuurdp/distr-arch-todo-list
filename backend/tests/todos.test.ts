import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApi, registerUser } from './helpers.js';

let api;
let auth;

beforeEach(async () => {
  api = await createTestApi();
  ({ auth } = await registerUser(api));
});

async function createTodo(data, headers = auth) {
  const res = await api.post('/api/todos').set(headers).send(data);
  return res.body;
}

describe('autenticação', () => {
  it('todas as rotas exigem token', async () => {
    const responses = await Promise.all([
      api.get('/api/todos'),
      api.post('/api/todos').send({ title: 'Estudar' }),
      api.get('/api/todos/1'),
      api.put('/api/todos/1').send({ title: 'Estudar', completed: true }),
      api.delete('/api/todos/1'),
    ]);

    expect(responses.map((res) => res.status)).toEqual([401, 401, 401, 401, 401]);
  });
});

describe('POST /api/todos', () => {
  it('cria uma tarefa pendente', async () => {
    const res = await api
      .post('/api/todos')
      .set(auth)
      .send({ title: 'Estudar React', description: 'Hooks e rotas', dueDate: '2026-12-01' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Estudar React',
      description: 'Hooks e rotas',
      dueDate: '2026-12-01',
      completed: false,
      categoryId: null,
      category: null,
    });
    expect(res.body.createdAt).toEqual(expect.any(String));
  });

  it('cria uma tarefa dentro de uma categoria', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });

    const res = await api
      .post('/api/todos')
      .set(auth)
      .send({ title: 'Estudar React', categoryId: category.body.id });

    expect(res.status).toBe(201);
    expect(res.body.category).toEqual({ id: category.body.id, name: 'Estudos' });
  });

  it('valida os campos', async () => {
    const res = await api
      .post('/api/todos')
      .set(auth)
      .send({ title: '', dueDate: '01/12/2026', categoryId: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Dados inválidos',
      details: {
        title: 'Título é obrigatório',
        dueDate: 'Prazo deve estar no formato AAAA-MM-DD',
        categoryId: 'Categoria inválida',
      },
    });
  });

  it('recusa categoria inexistente', async () => {
    const res = await api.post('/api/todos').set(auth).send({ title: 'Estudar', categoryId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({ categoryId: 'Categoria não encontrada' });
  });

  it('recusa categoria de outro usuário', async () => {
    const other = await registerUser(api, { email: 'bia@teste.com' });
    const category = await api.post('/api/categories').set(other.auth).send({ name: 'Da Bia' });

    const res = await api
      .post('/api/todos')
      .set(auth)
      .send({ title: 'Estudar', categoryId: category.body.id });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/todos', () => {
  it('lista as tarefas do usuário', async () => {
    await createTodo({ title: 'Primeira' });
    await createTodo({ title: 'Segunda' });

    const res = await api.get('/api/todos').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.content.map((todo) => todo.title).sort()).toEqual(['Primeira', 'Segunda']);
  });

  it('filtra por situação', async () => {
    const done = await createTodo({ title: 'Feita' });
    await createTodo({ title: 'Pendente' });
    await api.put(`/api/todos/${done.id}`).set(auth).send({ title: 'Feita', completed: true });

    const completed = await api.get('/api/todos?completed=true').set(auth);
    const pending = await api.get('/api/todos?completed=false').set(auth);

    expect(completed.body.content.map((todo) => todo.title)).toEqual(['Feita']);
    expect(pending.body.content.map((todo) => todo.title)).toEqual(['Pendente']);
  });

  it('filtra por categoria', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    await createTodo({ title: 'Com categoria', categoryId: category.body.id });
    await createTodo({ title: 'Sem categoria' });

    const res = await api.get(`/api/todos?categoryId=${category.body.id}`).set(auth);

    expect(res.body.content.map((todo) => todo.title)).toEqual(['Com categoria']);
  });

  it('filtra tarefas sem categoria', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    await createTodo({ title: 'Com categoria', categoryId: category.body.id });
    await createTodo({ title: 'Sem categoria' });

    const res = await api.get('/api/todos?categoryId=none').set(auth);

    expect(res.body.content.map((todo) => todo.title)).toEqual(['Sem categoria']);
  });

  it('combina os filtros de situação e categoria', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    const done = await createTodo({ title: 'Feita', categoryId: category.body.id });
    await createTodo({ title: 'Pendente', categoryId: category.body.id });
    const doneWithout = await createTodo({ title: 'Feita sem categoria' });
    await api
      .put(`/api/todos/${done.id}`)
      .set(auth)
      .send({ title: 'Feita', categoryId: category.body.id, completed: true });
    await api
      .put(`/api/todos/${doneWithout.id}`)
      .set(auth)
      .send({ title: 'Feita sem categoria', completed: true });

    const res = await api
      .get(`/api/todos?completed=true&categoryId=${category.body.id}`)
      .set(auth);

    expect(res.body.content.map((todo) => todo.title)).toEqual(['Feita']);
  });

  it('recusa filtro inválido', async () => {
    const res = await api.get('/api/todos?completed=talvez').set(auth);

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({ completed: 'Use true ou false' });
  });

  it('recusa categoria inválida no filtro', async () => {
    const res = await api.get('/api/todos?categoryId=abc').set(auth);

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({ categoryId: 'Categoria inválida' });
  });

  it('filtra por prazo antes de uma data (atrasadas)', async () => {
    await createTodo({ title: 'Venceu ontem', dueDate: '2026-11-17' });
    await createTodo({ title: 'Vence hoje', dueDate: '2026-11-18' });
    await createTodo({ title: 'Sem prazo' });
    const done = await createTodo({ title: 'Concluída e vencida', dueDate: '2026-11-01' });
    await api
      .put(`/api/todos/${done.id}`)
      .set(auth)
      .send({ title: 'Concluída e vencida', dueDate: '2026-11-01', completed: true });

    const res = await api.get('/api/todos?completed=false&dueBefore=2026-11-18').set(auth);

    expect(res.body.content.map((todo) => todo.title)).toEqual(['Venceu ontem']);
  });

  it('recusa data inválida no filtro de prazo', async () => {
    const res = await api.get('/api/todos?dueBefore=18/11/2026').set(auth);

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({ dueBefore: 'Data deve estar no formato AAAA-MM-DD' });
  });
});

describe('ordenação das tarefas', () => {
  async function complete(todo) {
    await api
      .put(`/api/todos/${todo.id}`)
      .set(auth)
      .send({ title: todo.title, dueDate: todo.dueDate, categoryId: todo.categoryId, completed: true });
  }

  const titles = (res) => res.body.content.map((todo) => todo.title);

  it('pendentes por prazo mais próximo, sem prazo no fim e concluídas por último', async () => {
    await createTodo({ title: 'Sem prazo' });
    await createTodo({ title: 'Daqui a 10 dias', dueDate: '2099-01-11' });
    await createTodo({ title: 'Vencida', dueDate: '2000-01-01' });
    await createTodo({ title: 'Daqui a 1 dia', dueDate: '2099-01-02' });
    await complete(await createTodo({ title: 'Concluída sem prazo' }));
    await complete(await createTodo({ title: 'Concluída vencida', dueDate: '1999-12-31' }));

    const res = await api.get('/api/todos').set(auth);

    expect(titles(res)).toEqual([
      'Vencida',
      'Daqui a 1 dia',
      'Daqui a 10 dias',
      'Sem prazo',
      'Concluída vencida',
      'Concluída sem prazo',
    ]);
  });

  it('desempata pela tarefa mais nova', async () => {
    await createTodo({ title: 'Antiga', dueDate: '2099-01-01' });
    await createTodo({ title: 'Nova', dueDate: '2099-01-01' });

    const res = await api.get('/api/todos').set(auth);

    expect(titles(res)).toEqual(['Nova', 'Antiga']);
  });

  it('mantém a ordem entre as páginas', async () => {
    await createTodo({ title: 'Prazo 3', dueDate: '2099-01-03' });
    await createTodo({ title: 'Prazo 1', dueDate: '2099-01-01' });
    await createTodo({ title: 'Sem prazo' });
    await createTodo({ title: 'Prazo 2', dueDate: '2099-01-02' });

    const first = await api.get('/api/todos?size=2').set(auth);
    const second = await api.get('/api/todos?size=2&page=2').set(auth);

    expect(titles(first)).toEqual(['Prazo 1', 'Prazo 2']);
    expect(titles(second)).toEqual(['Prazo 3', 'Sem prazo']);
  });

  it('vale também para as tarefas de uma categoria', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    const categoryId = category.body.id;
    await complete(await createTodo({ title: 'Concluída', categoryId, dueDate: '2000-01-01' }));
    await createTodo({ title: 'Sem prazo', categoryId });
    await createTodo({ title: 'Com prazo', categoryId, dueDate: '2099-01-01' });

    const res = await api.get(`/api/categories/${categoryId}/todos`).set(auth);

    expect(res.body.map((todo) => todo.title)).toEqual(['Com prazo', 'Sem prazo', 'Concluída']);
  });
});

describe('paginação de GET /api/todos', () => {
  async function createMany(count: number) {
    for (let index = 1; index <= count; index++) {
      await createTodo({ title: `Tarefa ${String(index).padStart(2, '0')}` });
    }
  }

  it('usa página 1 com 10 itens por padrão', async () => {
    await createMany(12);

    const res = await api.get('/api/todos').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, size: 10, totalElements: 12, totalPages: 2 });
    expect(res.body.content).toHaveLength(10);
    expect(res.body.content[0].title).toBe('Tarefa 12');
  });

  it('devolve a página pedida', async () => {
    await createMany(12);

    const res = await api.get('/api/todos?page=2').set(auth);

    expect(res.body).toMatchObject({ page: 2, size: 10, totalElements: 12, totalPages: 2 });
    expect(res.body.content.map((todo) => todo.title)).toEqual(['Tarefa 02', 'Tarefa 01']);
  });

  it('aceita outro tamanho de página', async () => {
    await createMany(5);

    const res = await api.get('/api/todos?size=2&page=3').set(auth);

    expect(res.body).toMatchObject({ page: 3, size: 2, totalElements: 5, totalPages: 3 });
    expect(res.body.content.map((todo) => todo.title)).toEqual(['Tarefa 01']);
  });

  it('pagina junto com os filtros', async () => {
    await createMany(3);
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    for (let index = 1; index <= 3; index++) {
      await createTodo({ title: `Estudo ${index}`, categoryId: category.body.id });
    }

    const res = await api.get(`/api/todos?categoryId=${category.body.id}&size=2`).set(auth);

    expect(res.body).toMatchObject({ totalElements: 3, totalPages: 2 });
    expect(res.body.content.map((todo) => todo.title)).toEqual(['Estudo 3', 'Estudo 2']);
  });

  it('devolve lista vazia depois da última página', async () => {
    await createMany(3);

    const res = await api.get('/api/todos?page=5').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 5, totalElements: 3, totalPages: 1, content: [] });
  });

  it('responde zero páginas quando não há tarefas', async () => {
    const res = await api.get('/api/todos').set(auth);

    expect(res.body).toEqual({ content: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('recusa página e tamanho inválidos', async () => {
    const page = await api.get('/api/todos?page=0').set(auth);
    const size = await api.get('/api/todos?size=abc').set(auth);
    const tooBig = await api.get('/api/todos?size=51').set(auth);

    expect(page.status).toBe(400);
    expect(page.body.details).toEqual({ page: 'Página inválida' });
    expect(size.body.details).toEqual({ size: 'Tamanho de página inválido' });
    expect(tooBig.body.details).toEqual({ size: 'Tamanho de página deve ser no máximo 50' });
  });
});

describe('GET /api/todos/:id', () => {
  it('busca uma tarefa', async () => {
    const { id } = await createTodo({ title: 'Estudar' });

    const res = await api.get(`/api/todos/${id}`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Estudar');
  });

  it('responde 404 para id inexistente ou inválido', async () => {
    const missing = await api.get('/api/todos/999').set(auth);
    const invalid = await api.get('/api/todos/abc').set(auth);

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Tarefa não encontrada');
    expect(invalid.status).toBe(404);
  });
});

describe('PUT /api/todos/:id', () => {
  it('atualiza todos os campos', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    const { id } = await createTodo({ title: 'Estudar', description: 'Antiga' });

    const res = await api.put(`/api/todos/${id}`).set(auth).send({
      title: 'Estudar Node',
      description: 'Nova',
      dueDate: '2026-12-10',
      categoryId: category.body.id,
      completed: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      title: 'Estudar Node',
      description: 'Nova',
      dueDate: '2026-12-10',
      completed: true,
      category: { id: category.body.id, name: 'Estudos' },
    });
  });

  it('limpa os campos opcionais omitidos', async () => {
    const { id } = await createTodo({ title: 'Estudar', description: 'Algo', dueDate: '2026-12-01' });

    const res = await api.put(`/api/todos/${id}`).set(auth).send({ title: 'Estudar', completed: false });

    expect(res.body).toMatchObject({ description: null, dueDate: null, category: null });
  });

  it('exige o campo completed', async () => {
    const { id } = await createTodo({ title: 'Estudar' });

    const res = await api.put(`/api/todos/${id}`).set(auth).send({ title: 'Estudar' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({ completed: 'Informe se a tarefa está concluída' });
  });

  it('responde 404 para tarefa inexistente', async () => {
    const res = await api.put('/api/todos/999').set(auth).send({ title: 'Estudar', completed: true });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/todos/:id', () => {
  it('remove a tarefa', async () => {
    const { id } = await createTodo({ title: 'Estudar' });

    const res = await api.delete(`/api/todos/${id}`).set(auth);

    expect(res.status).toBe(204);
    expect((await api.get(`/api/todos/${id}`).set(auth)).status).toBe(404);
  });

  it('responde 404 para tarefa inexistente', async () => {
    const res = await api.delete('/api/todos/999').set(auth);

    expect(res.status).toBe(404);
  });
});

describe('isolamento entre usuários', () => {
  it('um usuário não enxerga nem altera tarefas de outro', async () => {
    const { id } = await createTodo({ title: 'Da Ana' });
    const other = await registerUser(api, { email: 'bia@teste.com' });

    const list = await api.get('/api/todos').set(other.auth);
    const get = await api.get(`/api/todos/${id}`).set(other.auth);
    const put = await api
      .put(`/api/todos/${id}`)
      .set(other.auth)
      .send({ title: 'Invadida', completed: true });
    const del = await api.delete(`/api/todos/${id}`).set(other.auth);

    expect(list.body.content).toEqual([]);
    expect([get.status, put.status, del.status]).toEqual([404, 404, 404]);
    expect((await api.get(`/api/todos/${id}`).set(auth)).body.title).toBe('Da Ana');
  });
});

describe('GET /api/todos/summary', () => {
  it('conta o total e as concluídas, só do próprio usuário', async () => {
    const done = await createTodo({ title: 'Feita' });
    await createTodo({ title: 'Pendente' });
    await api.put(`/api/todos/${done.id}`).set(auth).send({ title: 'Feita', completed: true });
    const other = await registerUser(api, { email: 'bia@teste.com' });
    await createTodo({ title: 'Da Bia' }, other.auth);

    const res = await api.get('/api/todos/summary').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 2, completed: 1 });
  });

  it('responde zero para quem não tem tarefas', async () => {
    const res = await api.get('/api/todos/summary').set(auth);

    expect(res.body).toEqual({ total: 0, completed: 0 });
  });

  it('exige token', async () => {
    const res = await api.get('/api/todos/summary');

    expect(res.status).toBe(401);
  });
});
