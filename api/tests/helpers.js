import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

export function createTestApi() {
  return request(createApp(createDb(':memory:')));
}

export async function registerUser(api, overrides = {}) {
  const res = await api.post('/api/users/register').send({
    name: 'Ana Teste',
    email: 'ana@teste.com',
    password: 'Senha@123',
    ...overrides,
  });
  return { ...res.body, auth: { Authorization: `Bearer ${res.body.token}` } };
}
