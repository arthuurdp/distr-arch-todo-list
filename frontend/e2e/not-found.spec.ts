import { expect, test } from '@playwright/test'
import { createUser, login } from './helpers'

test.describe('página não encontrada', () => {
  test('mostra 404 para um endereço que não existe', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe')

    await expect(page).toHaveURL('/pagina-que-nao-existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
    await expect(page.getByText('/pagina-que-nao-existe')).toBeVisible()

    await page.getByRole('link', { name: 'Ir para o login' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('leva de volta para as tarefas quem está logado', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)

    await page.goto('/categorias/123/nada')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()

    await page.getByRole('link', { name: 'Ir para as tarefas' }).click()
    await expect(page.getByRole('heading', { name: 'Tarefas', level: 1 })).toBeVisible()
  })
})
