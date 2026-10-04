# Triagem CAS de afastamentos

O CAS realiza a triagem administrativa do processo de afastamento pela rota
`/afastamentos/cas`. A etapa registra o responsável, data/hora, resultado,
comentários e encaminhamento, mantendo histórico em `afastamentos.movimentacoes`.

Na interface, o responsável escolhe apenas a decisão da triagem e informa o
comentário. O resultado técnico e o encaminhamento são derivados da decisão,
evitando combinações incompatíveis.

O histórico operacional identifica o usuário responsável por cada ação. O nome
é resolvido pela RPC `get_movimentacoes_afastamento`; registros antigos sem
autoria disponível são apresentados como ações do sistema.

Há um único campo textual obrigatório, cujo rótulo muda conforme a decisão. Na
complementação, esse conteúdo também é utilizado como solicitação enviada à
unidade responsável.

Ao encaminhar para avaliação, o CAS deve selecionar um avaliador ativo,
disponível e autorizado. O avaliador pode ser médico, perito ou profissional
autorizado. A lista é ordenada pela quantidade de avaliações pendentes, da
menor para a maior fila. A atribuição fica registrada em
`afastamentos.avaliacoes_medicas.avaliador_id` e a notificação é direcionada
ao usuário do profissional selecionado.

### Reatribuição médica

Quando já existe uma avaliação pendente, a interface substitui a triagem comum
pela ação **Reatribuir médico**. A transferência exige outro profissional,
justificativa obrigatória e confirmação explícita. A atribuição anterior passa
para `cancelada`, a nova passa para `pendente`, a notificação pendente anterior
é removida e o histórico registra os dois médicos e a justificativa.

- Reenvio ao mesmo médico é bloqueado.
- Troca de médico sem `permitir_reatribuicao: true` é bloqueada.
- Processos `avaliado`, `aguardando_rh` ou `concluido` não podem retornar à
  perícia por essa RPC; uma eventual reabertura deve possuir fluxo próprio.

| Decisão na interface | Resultado registrado | Encaminhamento registrado |
| --- | --- | --- |
| Solicitar complementação | `documentacao_incompleta` | `solicitar_complementacao` |
| Homologar | `homologado` | `homologar` |
| Encaminhar para avaliação médica/pericial | `necessita_avaliacao_medica` | `encaminhar_avaliacao` |

## Endpoints

Use a RPC `encaminhar_avaliacao_afastamento` para encaminhar um avaliador:

```ts
const { error } = await supabase.rpc("encaminhar_avaliacao_afastamento", {
  target_afastamento_id: "8d65d778-8f46-40f4-8a96-43f5c7592a9f",
  comentarios: "Documentos conferidos. Necessária avaliação pericial.",
  target_avaliador_id: "762ee980-01f9-48c9-8878-0c11ec043921",
  permitir_reatribuicao: false,
});

if (error) throw error;
```

Use a RPC `responder_complementacao_afastamento` para responder a pendência
documental vinculada ao processo:

```ts
const { error } = await supabase.rpc("responder_complementacao_afastamento", {
  target_afastamento_id: "8d65d778-8f46-40f4-8a96-43f5c7592a9f",
  resposta: "Documento corrigido anexado e informação funcional revisada.",
  documento_nome: "12345-maria-silva-atestado-complementacao-2026-10-03.pdf",
  documento_url:
    "complementacoes/8d65d778-8f46-40f4-8a96-43f5c7592a9f/0f3d-documento.pdf",
});

if (error) throw error;
```

O frontend deve fazer upload prévio no bucket privado
`afastamentos-documentos`, usando o prefixo
`complementacoes/<afastamento_id>/`. `documento_nome` e `documento_url` podem
ser `null` quando a resposta não exigir anexo. A resposta textual é obrigatória.

## Resultados aceitos

| Valor | Uso |
| --- | --- |
| `documentacao_regular` | Documentação suficiente para prosseguir. |
| `documentacao_incompleta` | Há pendência documental. |
| `necessita_avaliacao_medica` | O caso deve seguir para avaliação médica/pericial. |
| `homologado` | O CAS homologou administrativamente quando permitido. |

## Encaminhamentos aceitos

| Valor | Efeito |
| --- | --- |
| `registrar` | Registra a triagem e mantém o processo em análise CAS. |
| `solicitar_complementacao` | Altera para `aguardando_complementacao` e cria pendência documental. |
| `homologar` | Altera para `aguardando_rh` e registra homologação administrativa. |
| `encaminhar_avaliacao` | Altera para `aguardando_avaliacao`. |
| `encaminhar_rh` | Altera para `aguardando_rh`. |

## Rastreabilidade e notificações

- A RPC valida `afastamentos:analisar`.
- Complementação exige também `afastamentos:solicitar_complementacao`.
- Responder complementação exige `afastamentos:complementar`, processo dentro
  do escopo do usuário e status `aguardando_complementacao`.
- Avaliação exige também `afastamentos:encaminhar_avaliacao`.
- O avaliador precisa estar ativo, disponível e possuir `afastamentos:avaliar`.
- A devolutiva é impedida para outro profissional, exceto administrador.
- A movimentação gravada usa `tipo = 'triagem'`, `criado_por = auth.uid()` e
  `criado_em = now()`.
- Solicitações de complementação criam registro em
  `afastamentos.complementacoes`; respostas atualizam a pendência mais recente,
  registram movimentação `tipo = 'complementacao'` e retornam o processo para
  `aguardando_analise`.
- Notificações internas são gravadas em `afastamentos.notificacoes` para os
  envolvidos conforme o encaminhamento.

## Compatibilidade

A RPC `registrar_analise_afastamento` continua disponível para os demais
encaminhamentos. Todo novo encaminhamento usa
`encaminhar_avaliacao_afastamento`.
