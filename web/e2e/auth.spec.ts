import { expect, test } from '@playwright/test'
import { createUser, login, PASSWORD } from './helpers'

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

  test('guarda o token JWT e o envia nas rotas protegidas', async ({ page, request }) => {
    const user = await createUser(request)
    const todosRequest = page.waitForRequest(
      (req) => req.url().endsWith('/api/todos') && req.method() === 'GET',
    )

    await login(page, user)

    const token = await page.evaluate(() => localStorage.getItem('todolist.token'))
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    expect((await todosRequest).headers().authorization).toBe(`Bearer ${token}`)
  })

  test('mantém a sessão ao recarregar e encerra ao sair', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Tarefas', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Abrir menu da conta' }).click()
    await expect(page.getByText(user.email)).toBeVisible()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page).toHaveURL('/login')
    expect(await page.evaluate(() => localStorage.getItem('todolist.token'))).toBeNull()
  })

  test('volta para o login quando o token é inválido', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('todolist.token', 'token-falso'))

    await page.goto('/')

    await expect(page).toHaveURL('/login')
  })

  test('navega entre as páginas e mostra quem fez o projeto', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)

    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Sobre' }).click()

    await expect(page).toHaveURL('/sobre')
    await expect(page.getByRole('heading', { name: 'Quem fez' })).toBeVisible()
  })
})
