import request from 'supertest';
import { inject } from 'vitest';
import { createApp } from '../src/app.js';
import { createPrismaClient } from '../src/database.js';

export const prisma = createPrismaClient(inject('databaseUrl'));
const app = createApp(prisma);

export async function createTestApi() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE users, categories, todos, refresh_tokens RESTART IDENTITY CASCADE',
  );
  return request(app);
}

export type TestApi = Awaited<ReturnType<typeof createTestApi>>;

export async function registerUser(api: TestApi, overrides = {}) {
  const res = await api.post('/api/users/register').send({
    name: 'Ana Teste',
    email: 'ana@teste.com',
    password: 'Senha@123',
    ...overrides,
  });
  return { ...res.body, auth: { Authorization: `Bearer ${res.body.token}` } };
}
