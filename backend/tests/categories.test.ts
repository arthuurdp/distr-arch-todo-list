import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApi, registerUser } from './helpers.js';

let api;
let auth;

beforeEach(async () => {
  api = await createTestApi();
  ({ auth } = await registerUser(api));
});

async function createCategory(name, headers = auth) {
  const res = await api.post('/api/categories').set(headers).send({ name });
  return res.body;
}

describe('autenticação', () => {
  it('todas as rotas exigem token', async () => {
    const responses = await Promise.all([
      api.get('/api/categories'),
      api.post('/api/categories').send({ name: 'Estudos' }),
      api.get('/api/categories/1'),
      api.get('/api/categories/1/todos'),
      api.put('/api/categories/1').send({ name: 'Estudos' }),
      api.delete('/api/categories/1'),
    ]);

    expect(responses.map((res) => res.status)).toEqual([401, 401, 401, 401, 401, 401]);
  });
});

describe('CRUD de categorias', () => {
  it('cria uma categoria', async () => {
    const res = await api.post('/api/categories').set(auth).send({ name: '  Estudos  ' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, name: 'Estudos', todoCount: 0 });
  });

  it('valida o nome', async () => {
    const res = await api.post('/api/categories').set(auth).send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({ name: 'Nome é obrigatório' });
  });

  it('recusa nome repetido', async () => {
    await createCategory('Estudos');

    const res = await api.post('/api/categories').set(auth).send({ name: 'estudos' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Já existe uma categoria com esse nome');
  });

  it('lista em ordem alfabética', async () => {
    await createCategory('Trabalho');
    await createCategory('Casa');

    const res = await api.get('/api/categories').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.map((category) => category.name)).toEqual(['Casa', 'Trabalho']);
  });

  it('busca por id', async () => {
    const { id } = await createCategory('Estudos');

    const res = await api.get(`/api/categories/${id}`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Estudos');
  });

  it('responde 404 para id inexistente ou inválido', async () => {
    const missing = await api.get('/api/categories/999').set(auth);
    const invalid = await api.get('/api/categories/abc').set(auth);

    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Categoria não encontrada');
    expect(invalid.status).toBe(404);
  });

  it('atualiza o nome', async () => {
    const { id } = await createCategory('Estudos');

    const res = await api.put(`/api/categories/${id}`).set(auth).send({ name: 'Faculdade' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: 'Faculdade' });
  });

  it('não deixa renomear para um nome já usado', async () => {
    await createCategory('Casa');
    const { id } = await createCategory('Estudos');

    const res = await api.put(`/api/categories/${id}`).set(auth).send({ name: 'Casa' });

    expect(res.status).toBe(409);
  });

  it('remove a categoria e mantém as tarefas, sem categoria', async () => {
    const { id } = await createCategory('Estudos');
    const todo = await api
      .post('/api/todos')
      .set(auth)
      .send({ title: 'Ler capítulo 3', categoryId: id });

    const res = await api.delete(`/api/categories/${id}`).set(auth);
    const after = await api.get(`/api/todos/${todo.body.id}`).set(auth);

    expect(res.status).toBe(204);
    expect((await api.get(`/api/categories/${id}`).set(auth)).status).toBe(404);
    expect(after.status).toBe(200);
    expect(after.body.category).toBeNull();
  });
});

describe('GET /api/categories/:id/todos', () => {
  it('lista apenas as tarefas da categoria', async () => {
    const studies = await createCategory('Estudos');
    const home = await createCategory('Casa');
    await api.post('/api/todos').set(auth).send({ title: 'Ler capítulo 3', categoryId: studies.id });
    await api.post('/api/todos').set(auth).send({ title: 'Fazer lista 2', categoryId: studies.id });
    await api.post('/api/todos').set(auth).send({ title: 'Lavar louça', categoryId: home.id });
    await api.post('/api/todos').set(auth).send({ title: 'Sem categoria' });

    const res = await api.get(`/api/categories/${studies.id}/todos`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body.map((todo) => todo.title).sort()).toEqual(['Fazer lista 2', 'Ler capítulo 3']);
    expect(res.body[0].category).toEqual({ id: studies.id, name: 'Estudos' });
  });

  it('atualiza a contagem de tarefas da categoria', async () => {
    const { id } = await createCategory('Estudos');
    await api.post('/api/todos').set(auth).send({ title: 'Ler capítulo 3', categoryId: id });

    const res = await api.get(`/api/categories/${id}`).set(auth);

    expect(res.body.todoCount).toBe(1);
  });

  it('responde 404 para categoria inexistente', async () => {
    const res = await api.get('/api/categories/999/todos').set(auth);

    expect(res.status).toBe(404);
  });
});

describe('isolamento entre usuários', () => {
  it('um usuário não enxerga nem altera categorias de outro', async () => {
    const { id } = await createCategory('Estudos');
    const other = await registerUser(api, { email: 'bia@teste.com' });

    const list = await api.get('/api/categories').set(other.auth);
    const get = await api.get(`/api/categories/${id}`).set(other.auth);
    const todos = await api.get(`/api/categories/${id}/todos`).set(other.auth);
    const put = await api.put(`/api/categories/${id}`).set(other.auth).send({ name: 'Invadida' });
    const del = await api.delete(`/api/categories/${id}`).set(other.auth);

    expect(list.body).toEqual([]);
    expect([get.status, todos.status, put.status, del.status]).toEqual([404, 404, 404, 404]);
  });

  it('usuários diferentes podem usar o mesmo nome', async () => {
    await createCategory('Estudos');
    const other = await registerUser(api, { email: 'bia@teste.com' });

    const res = await api.post('/api/categories').set(other.auth).send({ name: 'Estudos' });

    expect(res.status).toBe(201);
  });
});
