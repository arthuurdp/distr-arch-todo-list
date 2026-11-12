import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApi, registerUser } from './helpers.js';

let api;
let auth;

beforeEach(async () => {
  api = createTestApi();
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
    expect(res.body.map((todo) => todo.title).sort()).toEqual(['Primeira', 'Segunda']);
  });

  it('filtra por situação', async () => {
    const done = await createTodo({ title: 'Feita' });
    await createTodo({ title: 'Pendente' });
    await api.put(`/api/todos/${done.id}`).set(auth).send({ title: 'Feita', completed: true });

    const completed = await api.get('/api/todos?completed=true').set(auth);
    const pending = await api.get('/api/todos?completed=false').set(auth);

    expect(completed.body.map((todo) => todo.title)).toEqual(['Feita']);
    expect(pending.body.map((todo) => todo.title)).toEqual(['Pendente']);
  });

  it('filtra por categoria', async () => {
    const category = await api.post('/api/categories').set(auth).send({ name: 'Estudos' });
    await createTodo({ title: 'Com categoria', categoryId: category.body.id });
    await createTodo({ title: 'Sem categoria' });

    const res = await api.get(`/api/todos?categoryId=${category.body.id}`).set(auth);

    expect(res.body.map((todo) => todo.title)).toEqual(['Com categoria']);
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

    expect(list.body).toEqual([]);
    expect([get.status, put.status, del.status]).toEqual([404, 404, 404]);
    expect((await api.get(`/api/todos/${id}`).set(auth)).body.title).toBe('Da Ana');
  });
});
