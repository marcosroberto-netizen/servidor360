# Fluxo de teste: lançamento de afastamento pelo gestor

## Objetivo

Validar de ponta a ponta o lançamento de um afastamento por um gestor escolar, incluindo escopo da unidade, upload do atestado, confirmação de senha, geração e assinatura do documento digital, protocolo, histórico e encaminhamento para as filas seguintes.

Execute somente em desenvolvimento, teste ou demonstração. As contas e a senha de teste estão em [usuarios-teste.md](usuarios-teste.md).

## Pré-condições

- O projeto Supabase remoto está acessível e as migrations estão aplicadas.
- O frontend está executando com `pnpm dev`.
- Use `gestor@servidor360.local`.
- Escolha um servidor ativo pertencente a uma unidade vinculada ao gestor.
- Tenha um arquivo de teste PDF, PNG, JPG ou WEBP com até 10 MB.
- Registre a data e o horário do teste para localizar o protocolo e o histórico.

## Fluxo principal

1. Acesse `/login` e entre como `gestor@servidor360.local`.
   - Resultado esperado: login concluído e portal exibido.
2. Abra **Afastamentos** no portal.
   - Resultado esperado: `/afastamentos` carrega sem redirecionamento para `/unauthorized`.
   - Resultado esperado: a ação **Novo afastamento** está disponível.
3. Abra **Novo afastamento**.
   - Resultado esperado: a lista de funcionários é carregada.
4. Pesquise por nome, matrícula, CPF ou unidade.
   - Resultado esperado: a lista é filtrada sem exibir funcionários fora do escopo permitido.
5. Selecione um funcionário ativo da unidade vinculada.
   - Resultado esperado: nome, matrícula e unidade aparecem no cabeçalho do formulário.
6. Preencha os dados:
   - Tipo: `Atestado medico`.
   - Início: data de teste.
   - Fim: data igual ou posterior ao início.
   - Motivo: use um texto identificável, por exemplo `Teste E2E gestor 2026-10-03 HH:mm`.
   - Observações: informe o contexto do teste.
7. Anexe o arquivo de teste.
   - Resultado esperado: o nome do arquivo aparece no formulário.
8. Clique em **Registrar afastamento**.
   - Resultado esperado: o diálogo solicita a senha para assinatura.
9. Informe `Servidor360@2026` e confirme.
   - Resultado esperado: aparece o estado de envio sem permitir submissão duplicada.
10. Aguarde o processamento completo.
    - Resultado esperado: o afastamento é criado uma única vez.
    - Resultado esperado: um protocolo é gerado.
    - Resultado esperado: o atestado digital é gerado e assinado pelo perfil `solicitante`.
    - Resultado esperado: a mensagem `Afastamento registrado e atestado assinado com sucesso.` é exibida.
11. Feche a confirmação e atualize a fila.
    - Resultado esperado: existe exatamente um novo processo para o funcionário selecionado.
    - Resultado esperado: o status inicial é compatível com `aguardando_analise` ou com o status inicial definido pela RPC vigente.
12. Abra o processo criado.
    - Resultado esperado: servidor, vínculo, unidade, período, motivo e documento aparecem corretamente.
    - Resultado esperado: o histórico registra criação, documento digital e assinatura.
13. Abra **Visualizar assinatura digital**.
    - Resultado esperado: o documento mostra protocolo, hash SHA-256, status `Assinado` e a assinatura do gestor.
14. Acesse `/validar-documento/:protocolo` com o protocolo exibido.
    - Resultado esperado: o documento é encontrado e a assinatura é apresentada como registrada.
15. Entre com `cas@servidor360.local` e abra `/afastamentos/cas`.
    - Resultado esperado: o processo aparece na fila do CAS conforme o escopo e o status.
16. Entre com `educacao@servidor360.local` e abra `/afastamentos/educacao`.
    - Resultado esperado: o processo aparece na visão administrativa da Educação quando estiver em um dos status previstos para essa fila.
17. Entre com `rh@servidor360.local` e abra `/afastamentos/dp`.
    - Resultado esperado: o processo só aparece quando chegar a `avaliado` ou `aguardando_rh`.

## Validações negativas

| Caso | Ação | Resultado esperado |
| --- | --- | --- |
| Escopo | Tentar localizar servidor de outra unidade | O servidor não aparece ou a operação é recusada pelo banco. |
| Campos obrigatórios | Enviar sem servidor, período ou motivo | O formulário impede o envio. |
| Período inválido | Informar fim anterior ao início | O envio é recusado no formulário ou pela RPC. |
| Tipo de arquivo | Anexar arquivo diferente de PDF, PNG, JPG ou WEBP | O arquivo é rejeitado. |
| Tamanho | Anexar arquivo maior que 10 MB | O arquivo é rejeitado. |
| Senha | Informar senha incorreta | Nenhum afastamento é criado e nenhuma assinatura é registrada. |
| Duplo envio | Clicar várias vezes durante o processamento | Somente um processo deve ser criado. |
| Cancelamento | Fechar o diálogo de assinatura | O afastamento não deve ser criado. |
| Acesso direto | Gestor abrir `/afastamentos/cas` ou `/afastamentos/dp` | Acesso negado, salvo permissão explícita. |

## Evidências mínimas

- E-mail do usuário usado.
- Data e horário do teste.
- Funcionário e vínculo selecionados.
- Nome do arquivo anexado.
- Protocolo gerado.
- Status inicial observado.
- Captura ou registro do histórico com criação, documento e assinatura.
- Resultado da validação por protocolo.
- Resultado das filas CAS, Educação e DP.
- Mensagens observadas nos casos negativos.

## Critério de aprovação

O fluxo é aprovado quando o gestor cria exatamente um processo dentro do próprio escopo, o documento é armazenado e assinado, o protocolo pode ser validado, o histórico mantém as movimentações e as filas posteriores respeitam permissões e estados. Qualquer falha de autorização, duplicidade, arquivo órfão, ausência de assinatura ou exposição fora do escopo reprova o teste.
