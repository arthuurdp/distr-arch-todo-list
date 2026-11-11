import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createCategory, createTodo, createUser, login } from './helpers'

async function openCategories(page: Page) {
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Categorias' }).click()
  await expect(page.getByRole('heading', { name: 'Categorias', level: 1 })).toBeVisible()
}

function categoryItem(page: Page, name: string) {
  return page
    .getByRole('list', { name: 'Lista de categorias' })
    .getByRole('listitem')
    .filter({ hasText: name })
}

test.describe('CRUD de categorias', () => {
  test('cria uma categoria', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)
    await openCategories(page)

    await page.getByLabel('Nova categoria').fill('Faculdade')
    await page.getByRole('button', { name: 'Criar categoria' }).click()

    await expect(page.getByText('Categoria criada')).toBeVisible()
    await expect(categoryItem(page, 'Faculdade')).toContainText('Nenhuma tarefa')
    await expect(page.getByLabel('Nova categoria')).toHaveValue('')
  })

  test('recusa nome repetido com a mensagem da API', async ({ page, request }) => {
    const user = await createUser(request)
    await createCategory(request, user, 'Faculdade')
    await login(page, user)
    await openCategories(page)

    await page.getByLabel('Nova categoria').fill('faculdade')
    await page.getByRole('button', { name: 'Criar categoria' }).click()

    await expect(page.getByRole('alert')).toHaveText('Já existe uma categoria com esse nome')
  })

  test('renomeia uma categoria', async ({ page, request }) => {
    const user = await createUser(request)
    await createCategory(request, user, 'Faculdade')
    await login(page, user)
    await openCategories(page)

    await page.getByRole('button', { name: 'Renomear "Faculdade"' }).click()
    const dialog = page.getByRole('dialog', { name: 'Renomear categoria' })
    await dialog.getByLabel('Nome').fill('Universidade')
    await dialog.getByRole('button', { name: 'Salvar nome' }).click()

    await expect(page.getByText('Categoria atualizada')).toBeVisible()
    await expect(categoryItem(page, 'Universidade')).toBeVisible()
    await expect(categoryItem(page, 'Faculdade')).toHaveCount(0)
  })

  test('mostra as tarefas de uma categoria', async ({ page, request }) => {
    const user = await createUser(request)
    const studies = await createCategory(request, user, 'Faculdade')
    const home = await createCategory(request, user, 'Casa')
    await createTodo(request, user, { title: 'Entregar o trabalho', categoryId: studies.id })
    await createTodo(request, user, { title: 'Estudar para a prova', categoryId: studies.id })
    await createTodo(request, user, { title: 'Lavar a louça', categoryId: home.id })
    await login(page, user)
    await openCategories(page)

    await expect(categoryItem(page, 'Faculdade')).toContainText('2 tarefas')
    await expect(categoryItem(page, 'Casa')).toContainText('1 tarefa')

    const todosResponse = page.waitForResponse(`**/api/categories/${studies.id}/todos`)
    await categoryItem(page, 'Faculdade').getByRole('button', { name: 'Ver tarefas' }).click()
    expect((await todosResponse).status()).toBe(200)

    const panel = page.getByRole('dialog', { name: 'Faculdade' })
    const todos = panel.getByRole('list', { name: 'Tarefas de Faculdade' }).getByRole('listitem')
    await expect(todos).toHaveCount(2)
    await expect(panel).toContainText('Entregar o trabalho')
    await expect(panel).toContainText('Estudar para a prova')
    await expect(panel).not.toContainText('Lavar a louça')
  })

  test('exclui uma categoria e mantém as tarefas dela', async ({ page, request }) => {
    const user = await createUser(request)
    const category = await createCategory(request, user, 'Casa')
    await createTodo(request, user, { title: 'Lavar a louça', categoryId: category.id })
    await login(page, user)
    await openCategories(page)

    await page.getByRole('button', { name: 'Excluir "Casa"' }).click()
    await page
      .getByRole('alertdialog', { name: 'Excluir categoria?' })
      .getByRole('button', { name: 'Excluir categoria' })
      .click()

    await expect(page.getByText('Categoria excluída')).toBeVisible()
    await expect(page.getByText('Nenhuma categoria ainda')).toBeVisible()

    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Tarefas' }).click()
    const item = page.getByRole('list', { name: 'Lista de tarefas' }).getByRole('listitem')
    await expect(item).toContainText('Lavar a louça')
    await expect(item).not.toContainText('Casa')
  })
})
