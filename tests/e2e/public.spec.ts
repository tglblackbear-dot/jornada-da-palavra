import { expect, test } from '@playwright/test'

test('landing apresenta a identidade da plataforma', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Conheça a Palavra')
  await expect(page.getByRole('link', { name: /Começar minha jornada/i })).toBeVisible()
})

test('rota protegida exige configuração quando Supabase não está definido', async ({ page }) => {
  await page.goto('/jornada')
  await expect(page.getByText('Configuração necessária')).toBeVisible()
  await expect(page.getByText(/Nenhuma autenticação ou dado será simulado/)).toBeVisible()
})
