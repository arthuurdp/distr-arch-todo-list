import { expect, test } from '@playwright/test'
import { createTodo, createUser, login, PASSWORD } from './helpers'

test.describe('autenticação', () => {
  test('redireciona para o login quem não está autenticado', async ({ page }) => {
    await page.goto('/categorias')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  })

  test('cadastra uma conta nova e entra direto na lista', async ({ page }) => {
    const email = `novo.${Date.now()}@teste.com`

    await page.goto('/login')
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await page.getByLabel('Nome').fill('Bia Nova')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Nenhuma tarefa por aqui' })).toBeVisible()
  })

  test('mostra os erros de validação do cadastro vindos da API', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByLabel('Nome').fill('Bia')
    await page.getByLabel('Email').fill('nao-e-email')
    await page.getByLabel('Senha').fill('123')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Email inválido')).toBeVisible()
    await expect(page.getByText('Senha deve ter no mínimo 8 caracteres')).toBeVisible()
  })

  test('recusa senha incorreta', async ({ page, request }) => {
    const user = await createUser(request)

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Senha').fill('senha-errada')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('alert')).toHaveText('Email ou senha incorretos')
    await expect(page).toHaveURL('/login')
  })

  test('envia o access token no cabeçalho e não o guarda no navegador', async ({ page, request }) => {
    const user = await createUser(request)
    const todosRequest = page.waitForRequest(
      (req) => req.url().endsWith('/api/todos') && req.method() === 'GET',
    )

    await login(page, user)

    expect((await todosRequest).headers().authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/)
    const stored = await page.evaluate(() =>
      JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]),
    )
    expect(stored).not.toContain('eyJ')
  })

  test('guarda o refresh token em cookie httpOnly e SameSite=Strict', async ({ page, request, context }) => {
    const user = await createUser(request)
    await login(page, user)

    const cookie = (await context.cookies()).find((item) => item.name === 'refresh_token')

    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/api/users' })
    expect(await page.evaluate(() => document.cookie)).not.toContain('refresh_token')
  })

  test('mantém a sessão ao recarregar e encerra ao sair', async ({ page, request, context }) => {
    const user = await createUser(request)
    await login(page, user)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Tarefas', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Abrir menu da conta' }).click()
    await expect(page.getByText(user.email)).toBeVisible()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page).toHaveURL('/login')
    expect((await context.cookies()).find((item) => item.name === 'refresh_token')).toBeUndefined()

    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('sair revoga o refresh token no servidor', async ({ page, request, context }) => {
    const user = await createUser(request)
    await login(page, user)
    const cookie = (await context.cookies()).find((item) => item.name === 'refresh_token')

    await page.getByRole('button', { name: 'Abrir menu da conta' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/login')

    const res = await request.post('/api/users/refresh', {
      headers: { Cookie: `refresh_token=${cookie?.value}` },
    })
    expect(res.status()).toBe(401)
  })

  test('renova o access token expirado sem deslogar', async ({ page, request }) => {
    const user = await createUser(request)
    await createTodo(request, user, { title: 'Tarefa depois da renovação' })
    await login(page, user)
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await nav.getByRole('link', { name: 'Categorias' }).click()
    await expect(page.getByRole('heading', { name: 'Categorias', level: 1 })).toBeVisible()

    let rejected = false
    await page.route('**/api/todos', async (route) => {
      if (rejected) return route.continue()
      rejected = true
      await route.fulfill({ status: 401, json: { error: 'Token inválido ou expirado' } })
    })
    const refresh = page.waitForResponse('**/api/users/refresh')

    await nav.getByRole('link', { name: 'Tarefas' }).click()

    expect((await refresh).status()).toBe(200)
    await expect(page.getByText('Tarefa depois da renovação')).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('volta para o login quando a sessão não existe mais', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('todolist.session', '1'))

    await page.goto('/')

    await expect(page).toHaveURL('/login')
  })

  test('navega entre as páginas e mostra quem fez o projeto', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)

    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Sobre' }).click()

    await expect(page).toHaveURL('/sobre')
    await expect(page.getByRole('heading', { name: 'Desenvolvido por' })).toBeVisible()
  })
})
