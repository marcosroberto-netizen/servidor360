# Servidor 360 — Casos de Uso do Módulo de Afastamentos

## UC-A01 — Registrar Afastamento

**Ator principal:** Diretor / Unidade Escolar.

**Objetivo:** Criar um novo processo de afastamento.

**Pré-condições:**
- usuário autenticado;
- usuário autorizado;
- servidor dentro do escopo permitido.

**Fluxo principal:**
1. usuário acessa o módulo de Afastamentos;
2. inicia novo afastamento;
3. utiliza a busca global para localizar o servidor;
4. seleciona o servidor;
5. informa os dados necessários;
6. anexa o documento de origem;
7. revisa as informações;
8. confirma o envio;
9. sistema gera protocolo;
10. sistema vincula o processo ao prontuário;
11. sistema registra o histórico;
12. sistema encaminha para a próxima etapa.

**Fluxos alternativos:**
- servidor fora do escopo;
- documento obrigatório ausente;
- dados obrigatórios incompletos.

**Pós-condição:** Processo criado e disponível para tramitação.

---

## UC-A02 — Acompanhar Afastamento

**Atores:** Diretor, Educação, CAS e RH.

**Objetivo:** Consultar a situação atual do processo.

**Fluxo principal:**
1. usuário acessa os processos permitidos;
2. seleciona o afastamento;
3. sistema apresenta situação atual;
4. sistema apresenta pendências;
5. sistema apresenta histórico e informações autorizadas.

---

## UC-A03 — Responder Complementação

**Ator principal:** Diretor ou responsável autorizado.

**Pré-condição:** Processo aguardando complementação.

**Fluxo principal:**
1. usuário acessa a pendência;
2. consulta a solicitação;
3. corrige informações ou inclui documento;
4. confirma a resposta;
5. sistema registra a movimentação;
6. processo retorna para análise.

**Pós-condição:** Processo continua o fluxo sem perda do histórico anterior.

---

## UC-A04 — Analisar Processo

**Ator principal:** CAS.

**Pré-condição:** Processo disponível para análise.

**Fluxo principal:**
1. CAS acessa sua fila;
2. abre o processo;
3. consulta informações permitidas;
4. verifica a documentação;
5. registra a análise;
6. define a próxima ação.

**Fluxos alternativos:**
- solicitar complementação;
- encaminhar para avaliação;
- prosseguir para conclusão da etapa.

---

## UC-A05 — Solicitar Complementação

**Ator principal:** CAS.

**Objetivo:** Solicitar correção ou documentação adicional.

**Fluxo principal:**
1. CAS identifica a pendência;
2. registra o que precisa ser complementado;
3. define o responsável;
4. confirma a solicitação;
5. sistema registra no histórico;
6. pendência é disponibilizada ao responsável.

---

## UC-A06 — Encaminhar para Avaliação

**Ator principal:** CAS.

**Objetivo:** Disponibilizar o processo para avaliação de profissional autorizado.

**Fluxo principal:**
1. CAS seleciona o encaminhamento;
2. sistema identifica a fila ou profissional;
3. CAS confirma;
4. sistema registra a movimentação;
5. processo fica disponível para avaliação.

---

## UC-A07 — Emitir Devolutiva Formal

**Ator principal:** Médico / Profissional Autorizado.

**Pré-condições:**
- processo disponível para avaliação;
- profissional autorizado.

**Fluxo principal:**
1. profissional abre o processo;
2. consulta as informações necessárias;
3. seleciona o resultado;
4. registra a descrição;
5. registra orientações;
6. confirma a devolutiva;
7. sistema registra responsável, data e hora;
8. sistema vincula a devolutiva ao processo;
9. sistema registra no histórico;
10. processo segue para a próxima etapa.

---

## UC-A08 — Consultar Devolutiva

**Atores:** Diretor, Educação, CAS, Médico e RH.

**Objetivo:** Consultar a devolutiva conforme o nível de acesso.

**Regra:** visualizar a devolutiva não concede acesso automático ao prontuário médico completo.

---

## UC-A09 — Registrar Providência Administrativa

**Ator principal:** RH.

**Pré-condição:** Processo aguardando providência administrativa.

**Fluxo principal:**
1. RH acessa sua fila;
2. seleciona o processo;
3. consulta as informações necessárias;
4. registra a providência;
5. confirma a ação;
6. sistema registra responsável, data e histórico.

---

## UC-A10 — Concluir Processo

**Ator principal:** RH ou perfil responsável pela etapa final.

**Pré-condição:** Todas as etapas obrigatórias concluídas.

**Fluxo principal:**
1. usuário solicita conclusão;
2. sistema verifica pendências;
3. sistema altera o processo para concluído;
4. sistema registra a conclusão no histórico.

**Fluxo alternativo:**
- existindo pendências, o sistema bloqueia a conclusão.

---

## UC-A11 — Consultar Linha do Tempo

**Atores:** Usuários autorizados.

**Objetivo:** Visualizar as movimentações do afastamento em ordem cronológica.

**Fluxo principal:**
1. usuário acessa o processo;
2. seleciona a linha do tempo;
3. sistema valida suas permissões;
4. sistema apresenta os eventos autorizados.
