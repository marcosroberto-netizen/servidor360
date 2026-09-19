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

Ao encaminhar para avaliação médica/pericial, o CAS deve selecionar um médico
ativo e disponível. A lista é ordenada pela quantidade de avaliações pendentes,
da menor para a maior fila. A atribuição fica registrada em
`afastamentos.avaliacoes_medicas` e a notificação é direcionada ao profissional.
A RPC recebe o identificador no parâmetro `target_medico_id` e o persiste na
coluna `medico_id` da atribuição.

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

## Endpoint

Use a RPC `registrar_triagem_afastamento` para registrar a triagem:

```ts
const { error } = await supabase.rpc("registrar_triagem_afastamento", {
  target_afastamento_id: "8d65d778-8f46-40f4-8a96-43f5c7592a9f",
  resultado: "necessita_avaliacao_medica",
  encaminhamento: "encaminhar_avaliacao",
  comentarios: "Documentos conferidos. Necessária avaliação pericial.",
  complemento: null,
  target_medico_id: "762ee980-01f9-48c9-8878-0c11ec043921",
  permitir_reatribuicao: false,
});

if (error) throw error;
```

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
- Avaliação médica/pericial exige também `afastamentos:encaminhar_avaliacao`.
- Avaliação médica/pericial exige um médico elegível e impede a devolutiva por
  outro profissional, exceto administrador.
- A movimentação gravada usa `tipo = 'triagem'`, `criado_por = auth.uid()` e
  `criado_em = now()`.
- Complementações criam registro em `afastamentos.complementacoes`.
- Notificações internas são gravadas em `afastamentos.notificacoes` para os
  envolvidos conforme o encaminhamento.

## Compatibilidade

A RPC antiga `registrar_analise_afastamento` continua disponível para os demais
encaminhamentos. Avaliação médica/pericial deve usar a assinatura de
`registrar_triagem_afastamento` que recebe `target_medico_id`.
