import { expect, test } from "@playwright/test";

const processId = "11111111-1111-4111-8111-111111111111";
const vinculoId = "22222222-2222-4222-8222-222222222222";
const process = {
  id: processId,
  servidor_id: processId,
  vinculo_funcional_id: vinculoId,
  protocolo: "CAS-2026-0042",
  status: "aguardando_avaliacao",
  tipo: "Licença médica",
  data_inicio: "2026-10-01",
  data_fim: "2026-10-15",
  motivo: "Encaminhado para avaliação pericial.",
  observacoes: "Avaliar condições para retorno ao trabalho.",
  documento_origem_url: null,
  documento_origem_nome: null,
  iniciado_em: "2026-10-01T10:00:00Z",
  encaminhado_em: "2026-10-02T10:00:00Z",
};

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`lista compacta e atendimento em modal em ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route("**/rest/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let json: unknown;
      if (path.endsWith("/list_minhas_avaliacoes_afastamento"))
        json = [process];
      else if (path.endsWith("/get_vinculos_resumo_for_afastamentos"))
        json = [
          {
            id: processId,
            vinculo_id: vinculoId,
            nome: "Maria Oliveira",
            matricula: "12345",
            cargo: "Professora",
            unidade_id: processId,
            unidade_nome: "Escola Municipal Central",
            ativo: true,
          },
        ];
      else if (path.endsWith("/get_movimentacoes_afastamento"))
        json = [
          {
            id: processId,
            tipo: "encaminhamento",
            titulo: "Encaminhado pelo CAS",
            descricao: "Avaliação atribuída ao médico.",
            criado_em: "2026-10-02T10:00:00Z",
            criado_por_nome: "CAS Teste",
          },
        ];
      else if (path.endsWith("/afastamentos")) json = process;
      else if (path.endsWith("/avaliacoes_medicas")) json = null;
      else if (
        [
          "complementacoes",
          "devolutivas",
          "providencias",
          "documentos_digitais",
        ].some((name) => path.endsWith(`/${name}`))
      )
        json = [];
      else return route.continue();
      await route.fulfill({ json });
    });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill("medico4@servidor360.local");
    await page
      .getByLabel("Senha")
      .fill(globalThis.process.env.E2E_TEST_PASSWORD ?? "Servidor360@2026");
    await page.getByRole("button", { name: "Acessar", exact: true }).click();
    await expect(page).toHaveURL(/\/portal$/);
    await page.getByRole("link", { name: "Acessar Atendimento" }).click();
    await expect(
      page.getByRole("cell", { name: "Maria Oliveira", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("columnheader")).toHaveCount(5);
    await expect(page.getByRole("columnheader")).toHaveText([
      "ServidorA-Z",
      "Matrícula",
      "Período do afastamento",
      "Encaminhado em",
      "Ações",
    ]);
    await expect(
      page.getByRole("cell", {
        name: "01/10/2026 até 15/10/2026",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "02/10/2026", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Exportar Excel" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Observações do Atendimento")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/medico-lista-${viewport.width}.png`,
    });

    await page.getByRole("button", { name: "Avaliar", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Maria Oliveira" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Registrar devolutiva" }),
    ).toHaveCount(0);
    await dialog
      .getByRole("button", { name: "Registrar atendimento", exact: true })
      .click();
    await expect(dialog.getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Registrar devolutiva" }),
    ).toHaveCount(0);
    await dialog
      .getByLabel("Observações do Atendimento")
      .fill("Avaliação funcional realizada.");
    await dialog.getByRole("radio", { name: "Afastado", exact: true }).check();
    await dialog.getByRole("button", { name: "Registrar devolutiva" }).click();
    await expect(
      dialog.getByText("Informe o início do afastamento."),
    ).toBeVisible();
    await dialog
      .getByRole("radio", { name: "Apto com restrição", exact: true })
      .check();
    const restrictionsDialog = page.getByRole("dialog", {
      name: "Descrição das restrições",
      exact: true,
    });
    await expect(restrictionsDialog).toBeVisible();
    await restrictionsDialog
      .getByRole("button", { name: "Salvar restrições" })
      .click();
    await expect(restrictionsDialog.getByRole("alert")).toHaveText(
      "Descreva as restrições aplicáveis.",
    );
    const description =
      "Evitar levantamento de cargas e atividades repetitivas. ".repeat(40);
    await restrictionsDialog
      .getByLabel("Restrições aplicáveis")
      .fill(description);
    await restrictionsDialog
      .getByRole("button", { name: "Salvar restrições" })
      .click();
    await expect(restrictionsDialog.getByRole("alert")).toHaveText(
      "Informe o início e o fim da restrição.",
    );
    await restrictionsDialog
      .getByLabel("Início da restrição")
      .fill("2026-10-15");
    await restrictionsDialog.getByLabel("Fim da restrição").fill("2026-10-01");
    await restrictionsDialog
      .getByRole("button", { name: "Salvar restrições" })
      .click();
    await expect(restrictionsDialog.getByRole("alert")).toHaveText(
      "A data final deve ser posterior ou igual à inicial.",
    );
    await restrictionsDialog.getByLabel("Fim da restrição").fill("2026-10-30");
    await page.screenshot({
      path: `test-results/medico-restricoes-${viewport.width}.png`,
    });
    const restrictionBounds = await restrictionsDialog.boundingBox();
    expect(restrictionBounds!.x).toBeGreaterThanOrEqual(0);
    expect(restrictionBounds!.x + restrictionBounds!.width).toBeLessThanOrEqual(
      viewport.width,
    );
    expect(
      restrictionBounds!.y + restrictionBounds!.height,
    ).toBeLessThanOrEqual(viewport.height);
    await restrictionsDialog
      .getByRole("button", { name: "Salvar restrições" })
      .click();
    await expect(restrictionsDialog).toHaveCount(0);
    await expect(dialog.locator('textarea[name="restricoes"]')).toHaveCount(0);
    await expect(dialog.locator('input[type="date"]')).toHaveCount(0);
    await dialog.getByRole("button", { name: "Editar restrições" }).click();
    await expect(
      restrictionsDialog.getByLabel("Restrições aplicáveis"),
    ).toHaveValue(description.trim());
    await expect(
      restrictionsDialog.getByLabel("Início da restrição"),
    ).toHaveValue("2026-10-15");
    await expect(restrictionsDialog.getByLabel("Fim da restrição")).toHaveValue(
      "2026-10-30",
    );
    await restrictionsDialog
      .getByLabel("Início da restrição")
      .fill("2026-10-20");
    await restrictionsDialog
      .getByLabel("Restrições aplicáveis")
      .fill("Rascunho não salvo");
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Editar restrições" }).click();
    await expect(
      restrictionsDialog.getByLabel("Restrições aplicáveis"),
    ).toHaveValue(description.trim());
    await expect(
      restrictionsDialog.getByLabel("Início da restrição"),
    ).toHaveValue("2026-10-15");
    await restrictionsDialog
      .getByRole("button", { name: "Cancelar", exact: true })
      .click();
    await dialog
      .getByRole("radio", { name: "Aguardando complementação", exact: true })
      .check();
    await expect(
      dialog.getByLabel("Solicitação", { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Histórico", exact: true })
      .click();
    await expect(dialog.getByText("Encaminhado pelo CAS")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Registrar devolutiva" }),
    ).toHaveCount(0);
    await dialog
      .getByRole("button", { name: "Atendimento", exact: true })
      .click();
    await expect(dialog.getByLabel("Observações do Atendimento")).toHaveValue(
      "Avaliação funcional realizada.",
    );
    await page.screenshot({
      path: `test-results/medico-modal-${viewport.width}.png`,
    });
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Avaliar", exact: true }),
    ).toBeFocused();
  });
}
