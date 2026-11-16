import { expect, test } from '@playwright/test'

test('landing apresenta a identidade da plataforma', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Conheça a Palavra')
  await expect(page.getByRole('button', { name: /Começar minha jornada/i })).toBeVisible()
})

test('rota protegida redireciona para login (ou exige configuração)', async ({ page }) => {
  await page.goto('/jornada')
  await page.waitForTimeout(1500)
  if (page.url().includes('/login')) {
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  } else {
    await expect(page.getByText('Configuração necessária')).toBeVisible()
  }
})
