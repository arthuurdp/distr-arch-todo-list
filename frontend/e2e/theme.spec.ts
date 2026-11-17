import { expect, test } from '@playwright/test'
import { createUser, login } from './helpers'

test.describe('tema claro e escuro', () => {
  test('começa no modo escuro', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
    await expect(page.getByRole('switch', { name: 'Modo escuro' })).toBeChecked()
  })

  test('troca para o modo claro e mantém a escolha ao recarregar', async ({ page }) => {
    const html = page.locator('html')
    const darkMode = page.getByRole('switch', { name: 'Modo escuro' })
    await page.goto('/login')

    await darkMode.click()

    await expect(darkMode).not.toBeChecked()
    await expect(html).toHaveClass(/\blight\b/)
    await expect(html).not.toHaveClass(/\bdark\b/)

    await page.reload()
    await expect(html).toHaveClass(/\blight\b/)
    await expect(darkMode).not.toBeChecked()

    await darkMode.click()
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(darkMode).toBeChecked()
  })

  test('tem o seletor de tema no cabeçalho depois do login', async ({ page, request }) => {
    const user = await createUser(request)
    await login(page, user)
    const darkMode = page.getByRole('banner').getByRole('switch', { name: 'Modo escuro' })

    await darkMode.click()

    await expect(page.locator('html')).toHaveClass(/\blight\b/)
    await expect(darkMode).not.toBeChecked()
  })
})
