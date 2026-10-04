import { expect, test } from '@playwright/test'

test('medico acessa somente seu atendimento e bloqueia os demais modulos', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('medico4@servidor360.local')
  await page.getByLabel('Senha').fill(process.env.E2E_TEST_PASSWORD ?? 'Servidor360@2026')
  await page.getByRole('button', { name: 'Acessar', exact: true }).click()
  await expect(page).toHaveURL(/\/portal$/)
  await expect(page.getByRole('heading', { name: 'Atendimento Médico', exact: true })).toBeVisible()
  await expect(page.locator('main h3')).toHaveCount(1)
  await page.getByRole('link', { name: 'Acessar Atendimento' }).click()
  await expect(page).toHaveURL(/\/afastamentos\/medico$/)
  await expect(page.getByText('Minha Fila', { exact: true })).toBeVisible()

  for (const route of ['/afastamentos', '/afastamentos/cas', '/afastamentos/dp', '/afastamentos/educacao']) {
    await page.goto(route)
    await expect(page).toHaveURL(/\/unauthorized$/)
    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
  }
})
