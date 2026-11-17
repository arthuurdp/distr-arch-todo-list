import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createCategory, createTodo, createUser, login } from './helpers'

function todoList(page: Page) {
  return page.getByRole('list', { name: 'Lista de tarefas' })
}

function todoItem(page: Page, title: string) {
  return todoList(page).getByRole('listitem').filter({ hasText: title })
}

test.describe('CRUD de tarefas', () => {
  test('cria uma tarefa com descrição, prazo e categoria', async ({ page, request }) => {
    const user = await createUser(request)
    await createCategory(request, user, 'Faculdade')
    await login(page, user)

    await page.getByRole('button', { name: 'Nova tarefa' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nova tarefa' })
    await dialog.getByLabel('Título').fill('Entregar o trabalho de React')
    await dialog.getByLabel(/Descrição/).fill('Zip com API e front-end no Moodle')
    await dialog.getByLabel(/Prazo/).fill('2099-12-31')
    await dialog.getByLabel('Categoria').click()
    await page.getByRole('option', { name: 'Faculdade' }).click()
    await dialog.getByRole('button', { name: 'Criar tarefa' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Tarefa criada')).toBeVisible()

    const item = todoItem(page, 'Entregar o trabalho de React')
    await expect(item).toContainText('Zip com API e front-end no Moodle')
    await expect(item).toContainText('Faculdade')
    await expect(item).toContainText('Até 31/12/2099')
    await expect(page.getByText('0 de 1 concluída')).toBeVisible()
  })

  test('mostra o erro de validação quando o título fica vazio', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)

    await page.getByRole('button', { name: 'Nova tarefa' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nova tarefa' })
    await dialog.getByRole('button', { name: 'Criar tarefa' }).click()

    await expect(dialog.getByRole('alert')).toHaveText('Título é obrigatório')
    await expect(dialog).toBeVisible()
  })

  test('lista as tarefas salvas, inclusive depois de recarregar', async ({ page, request }) => {
    const user = await createUser(request)
    await createTodo(request, user, { title: 'Estudar para a prova' })
    await createTodo(request, user, { title: 'Comprar café' })
    await login(page, user)

    await expect(todoList(page).getByRole('listitem')).toHaveCount(2)

    await page.reload()

    await expect(todoItem(page, 'Estudar para a prova')).toBeVisible()
    await expect(todoItem(page, 'Comprar café')).toBeVisible()
  })

  test('edita uma tarefa', async ({ page, request }) => {
    const user = await createUser(request)
    await createTodo(request, user, { title: 'Estudar Node', description: 'Capítulo 1' })
    await login(page, user)

    await page.getByRole('button', { name: 'Editar "Estudar Node"' }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar tarefa' })
    await expect(dialog.getByLabel('Título')).toHaveValue('Estudar Node')
    await dialog.getByLabel('Título').fill('Estudar Express')
    await dialog.getByLabel(/Descrição/).fill('Rotas e middlewares')
    await dialog.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(page.getByText('Tarefa atualizada')).toBeVisible()
    await expect(todoItem(page, 'Estudar Express')).toContainText('Rotas e middlewares')
    await expect(todoItem(page, 'Estudar Node')).toHaveCount(0)

    await page.reload()
    await expect(todoItem(page, 'Estudar Express')).toBeVisible()
  })

  test('conclui uma tarefa e filtra por situação', async ({ page, request }) => {
    const user = await createUser(request)
    await createTodo(request, user, { title: 'Lavar a louça' })
    await createTodo(request, user, { title: 'Ler o capítulo 3' })
    await login(page, user)

    await page.getByRole('checkbox', { name: 'Marcar "Lavar a louça" como concluída' }).click()

    await expect(page.getByText('1 de 2 concluídas')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Reabrir "Lavar a louça"' })).toBeChecked()

    await page.getByRole('tab', { name: 'Pendentes' }).click()
    await expect(todoItem(page, 'Ler o capítulo 3')).toBeVisible()
    await expect(todoItem(page, 'Lavar a louça')).toHaveCount(0)

    await page.getByRole('tab', { name: 'Concluídas' }).click()
    await expect(todoItem(page, 'Lavar a louça')).toBeVisible()
    await expect(todoItem(page, 'Ler o capítulo 3')).toHaveCount(0)
  })

  test('filtra por categoria', async ({ page, request }) => {
    const user = await createUser(request)
    const category = await createCategory(request, user, 'Casa')
    await createTodo(request, user, { title: 'Lavar a louça', categoryId: category.id })
    await createTodo(request, user, { title: 'Ler o capítulo 3' })
    await login(page, user)

    await page.getByRole('combobox', { name: 'Filtrar por categoria' }).click()
    await page.getByRole('option', { name: 'Casa' }).click()

    await expect(todoItem(page, 'Lavar a louça')).toBeVisible()
    await expect(todoItem(page, 'Ler o capítulo 3')).toHaveCount(0)
  })

  test('exclui uma tarefa depois de confirmar', async ({ page, request }) => {
    const user = await createUser(request)
    await createTodo(request, user, { title: 'Tarefa para apagar' })
    await createTodo(request, user, { title: 'Tarefa que fica' })
    await login(page, user)

    await page.getByRole('button', { name: 'Excluir "Tarefa para apagar"' }).click()
    const confirm = page.getByRole('alertdialog', { name: 'Excluir tarefa?' })
    await confirm.getByRole('button', { name: 'Cancelar' }).click()
    await expect(todoItem(page, 'Tarefa para apagar')).toBeVisible()

    await page.getByRole('button', { name: 'Excluir "Tarefa para apagar"' }).click()
    await confirm.getByRole('button', { name: 'Excluir tarefa' }).click()

    await expect(page.getByText('Tarefa excluída')).toBeVisible()
    await expect(todoItem(page, 'Tarefa para apagar')).toHaveCount(0)
    await expect(todoItem(page, 'Tarefa que fica')).toBeVisible()

    await page.reload()
    await expect(todoList(page).getByRole('listitem')).toHaveCount(1)
  })

  test('cada usuário vê só as próprias tarefas', async ({ page, request }) => {
    const ana = await createUser(request)
    const bia = await createUser(request)
    await createTodo(request, ana, { title: 'Tarefa da Ana' })
    await login(page, bia)

    await expect(page.getByRole('heading', { name: 'Nenhuma tarefa por aqui' })).toBeVisible()
    await expect(page.getByText('Tarefa da Ana')).toHaveCount(0)
  })
})
