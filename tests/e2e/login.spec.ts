import { expect, test, type Page } from '@playwright/test'

type LoginAccount = {
  email: string
  expectedWelcome: RegExp
}

const password = process.env.E2E_TEST_PASSWORD ?? 'Servidor360@2026'

const accounts: LoginAccount[] = [
  {
    email: 'gestor@servidor360.local',
    expectedWelcome: /Bem-vindo,\s*Gestor Escolar Teste/i,
  },
  {
    email: 'cas@servidor360.local',
    expectedWelcome: /Bem-vindo,\s*CAS Teste/i,
  },
  {
    email: 'medico4@servidor360.local',
    expectedWelcome: /Bem-vindo,\s*Dr\. Daniel Martins Souza/i,
  },
]

function captureBrowserIssues(page: Page) {
  const consoleErrors: string[] = []
  const failedResponses: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
  })

  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()

    if (status >= 400 && !url.endsWith('/favicon.ico')) {
      failedResponses.push(`${status} ${url}`)
    }
  })

  return {
    expectNoIssues() {
      expect(consoleErrors, 'console/page errors').toEqual([])
      expect(failedResponses, 'failed network responses').toEqual([])
    },
  }
}

test.describe('login', () => {
  for (const account of accounts) {
    test(`autentica ${account.email} e abre o portal`, async ({ page }) => {
      const browserIssues = captureBrowserIssues(page)

      await test.step('abrir tela de login', async () => {
        await page.goto('/login')
        await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
        await expect(page.getByLabel('E-mail')).toBeVisible()
        await expect(page.getByLabel('Senha')).toBeVisible()
      })

      await test.step('enviar credenciais documentadas', async () => {
        await page.getByLabel('E-mail').fill(account.email)
        await page.getByLabel('Senha').fill(password)
        await page.getByRole('button', { name: 'Acessar' }).click()
      })

      await test.step('validar entrada no portal', async () => {
        await expect(page).toHaveURL(/\/portal$/)
        await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
        await expect(page.getByText(account.email)).toBeVisible()
        await expect(page.getByRole('heading', { name: account.expectedWelcome })).toBeVisible()
      })

      browserIssues.expectNoIssues()
    })
  }
})
