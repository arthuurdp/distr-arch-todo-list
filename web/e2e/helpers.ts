import { expect } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

export const PASSWORD = 'Senha@123'

export type TestUser = {
  name: string
  email: string
  headers: { Authorization: string }
}

export async function createUser(request: APIRequestContext): Promise<TestUser> {
  const name = 'Ana Teste'
  const email = `ana.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@teste.com`

  const res = await request.post('/api/users/register', {
    data: { name, email, password: PASSWORD },
  })
  expect(res.status()).toBe(201)

  const { token } = await res.json()
  return { name, email, headers: { Authorization: `Bearer ${token}` } }
}

export async function login(page: Page, user: TestUser) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Senha').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Tarefas', level: 1 })).toBeVisible()
}

export async function createCategory(request: APIRequestContext, user: TestUser, name: string) {
  const res = await request.post('/api/categories', { headers: user.headers, data: { name } })
  expect(res.status()).toBe(201)
  return (await res.json()) as { id: number; name: string }
}

export async function createTodo(
  request: APIRequestContext,
  user: TestUser,
  data: { title: string; description?: string; dueDate?: string; categoryId?: number },
) {
  const res = await request.post('/api/todos', { headers: user.headers, data })
  expect(res.status()).toBe(201)
  return (await res.json()) as { id: number; title: string }
}
