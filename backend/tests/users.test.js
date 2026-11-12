import { beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { createTestApi, registerUser } from './helpers.js';

let api;

beforeEach(() => {
  api = createTestApi();
});

describe('POST /api/users/register', () => {
  it('cria o usuário e retorna o token', async () => {
    const res = await api
      .post('/api/users/register')
      .send({ name: 'Ana Teste', email: 'Ana@Teste.com', password: 'Senha@123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: 1, name: 'Ana Teste', email: 'ana@teste.com' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('recusa email já cadastrado', async () => {
    await registerUser(api);

    const res = await api
      .post('/api/users/register')
      .send({ name: 'Outra Ana', email: 'ANA@teste.com', password: 'Senha@123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email já cadastrado');
  });

  it('valida os campos', async () => {
    const res = await api
      .post('/api/users/register')
      .send({ name: '', email: 'nao-e-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Dados inválidos',
      details: {
        name: 'Nome é obrigatório',
        email: 'Email inválido',
        password: 'Senha deve ter no mínimo 8 caracteres',
      },
    });
  });

  it('responde 400 para JSON mal formado', async () => {
    const res = await api
      .post('/api/users/register')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('JSON inválido');
  });
});

describe('POST /api/users/login', () => {
  beforeEach(async () => {
    await registerUser(api);
  });

  it('retorna o token JWT com credenciais corretas', async () => {
    const res = await api
      .post('/api/users/login')
      .send({ email: 'ana@teste.com', password: 'Senha@123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ana@teste.com');
    expect(jwt.decode(res.body.token)).toMatchObject({ sub: '1' });
  });

  it('recusa senha incorreta', async () => {
    const res = await api
      .post('/api/users/login')
      .send({ email: 'ana@teste.com', password: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou senha incorretos');
  });

  it('dá a mesma resposta para email inexistente', async () => {
    const res = await api
      .post('/api/users/login')
      .send({ email: 'ninguem@teste.com', password: 'Senha@123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou senha incorretos');
  });

  it('valida os campos', async () => {
    const res = await api.post('/api/users/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({
      email: 'Email é obrigatório',
      password: 'Senha é obrigatória',
    });
  });
});

describe('GET /api/users/me', () => {
  it('retorna o usuário dono do token', async () => {
    const { auth } = await registerUser(api);

    const res = await api.get('/api/users/me').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: 'Ana Teste', email: 'ana@teste.com' });
  });

  it('exige o token', async () => {
    const res = await api.get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token não informado');
  });

  it('recusa token inválido', async () => {
    const res = await api.get('/api/users/me').set('Authorization', 'Bearer token-falso');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido ou expirado');
  });

  it('recusa token assinado com outra chave', async () => {
    const forged = jwt.sign({}, 'outra-chave', { subject: '1' });
    await registerUser(api);

    const res = await api.get('/api/users/me').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});

describe('rotas inexistentes', () => {
  it('respondem 404 em JSON', async () => {
    const res = await api.get('/api/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Rota não encontrada');
  });
});
