import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApi, prisma, registerUser, type TestApi } from './helpers.js';

let api: TestApi;

beforeEach(async () => {
  api = await createTestApi();
});

function refreshCookie(res): string {
  const cookies = [res.headers['set-cookie']].flat().filter(Boolean);
  return cookies.find((cookie) => cookie.startsWith('refresh_token=')) ?? '';
}

function cookiePair(setCookie: string): string {
  return setCookie.split(';')[0];
}

async function login() {
  await registerUser(api);
  const res = await api
    .post('/api/users/login')
    .send({ email: 'ana@teste.com', password: 'Senha@123' });
  return cookiePair(refreshCookie(res));
}

describe('cookie do refresh token', () => {
  it('é enviado no login como httpOnly, SameSite=Strict e restrito a /api/users', async () => {
    await registerUser(api);

    const res = await api
      .post('/api/users/login')
      .send({ email: 'ana@teste.com', password: 'Senha@123' });
    const cookie = refreshCookie(res);

    expect(cookie).toMatch(/^refresh_token=[\w-]{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api/users');
    expect(cookie).toContain('Expires=');
  });

  it('também é enviado no cadastro', async () => {
    const res = await api
      .post('/api/users/register')
      .send({ name: 'Ana Teste', email: 'ana@teste.com', password: 'Senha@123' });

    expect(refreshCookie(res)).toContain('HttpOnly');
  });

  it('não aparece no corpo da resposta', async () => {
    const res = await api
      .post('/api/users/register')
      .send({ name: 'Ana Teste', email: 'ana@teste.com', password: 'Senha@123' });

    expect(Object.keys(res.body).sort()).toEqual(['token', 'user']);
  });

  it('é guardado no banco só como hash', async () => {
    const cookie = await login();
    const rawToken = cookie.replace('refresh_token=', '');

    const stored = await prisma.refreshToken.findMany();

    expect(stored.length).toBeGreaterThan(0);
    expect(stored.map((token) => token.tokenHash)).not.toContain(rawToken);
  });
});

describe('POST /api/users/refresh', () => {
  it('devolve um novo access token que funciona nas rotas protegidas', async () => {
    const cookie = await login();

    const res = await api.post('/api/users/refresh').set('Cookie', cookie);
    const me = await api.get('/api/users/me').set('Authorization', `Bearer ${res.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ana@teste.com');
    expect(me.status).toBe(200);
  });

  it('troca o refresh token a cada uso (rotação)', async () => {
    const cookie = await login();

    const res = await api.post('/api/users/refresh').set('Cookie', cookie);
    const rotated = cookiePair(refreshCookie(res));

    expect(rotated).toMatch(/^refresh_token=/);
    expect(rotated).not.toBe(cookie);
    expect((await api.post('/api/users/refresh').set('Cookie', rotated)).status).toBe(200);
  });

  it('responde 401 sem cookie', async () => {
    const res = await api.post('/api/users/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Sessão expirada. Entre novamente.');
  });

  it('responde 401 para um token desconhecido e apaga o cookie', async () => {
    const res = await api.post('/api/users/refresh').set('Cookie', 'refresh_token=inventado');

    expect(res.status).toBe(401);
    expect(refreshCookie(res)).toMatch(/^refresh_token=;/);
  });

  it('responde 401 para um token expirado', async () => {
    const cookie = await login();
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await api.post('/api/users/refresh').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });

  it('ao reusar um token já trocado, derruba todas as sessões do usuário', async () => {
    const cookie = await login();
    const first = await api.post('/api/users/refresh').set('Cookie', cookie);
    const current = cookiePair(refreshCookie(first));

    const reused = await api.post('/api/users/refresh').set('Cookie', cookie);
    const afterTheft = await api.post('/api/users/refresh').set('Cookie', current);

    expect(reused.status).toBe(401);
    expect(afterTheft.status).toBe(401);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
  });

  it('não afeta as sessões de outros usuários', async () => {
    const cookie = await login();
    const other = await api
      .post('/api/users/register')
      .send({ name: 'Bia', email: 'bia@teste.com', password: 'Senha@123' });
    const otherCookie = cookiePair(refreshCookie(other));
    await api.post('/api/users/refresh').set('Cookie', cookie);

    await api.post('/api/users/refresh').set('Cookie', cookie);
    const res = await api.post('/api/users/refresh').set('Cookie', otherCookie);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/users/logout', () => {
  it('revoga o refresh token e apaga o cookie', async () => {
    const cookie = await login();

    const res = await api.post('/api/users/logout').set('Cookie', cookie);
    const afterLogout = await api.post('/api/users/refresh').set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(refreshCookie(res)).toMatch(/^refresh_token=;/);
    expect(afterLogout.status).toBe(401);
  });

  it('responde 204 mesmo sem cookie', async () => {
    const res = await api.post('/api/users/logout');

    expect(res.status).toBe(204);
  });
});
