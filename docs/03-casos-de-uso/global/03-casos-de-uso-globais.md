# Servidor 360 — Casos de Uso Globais

## UC-G01 — Autenticar

**Ator:** Usuário Autorizado.

**Objetivo:** Permitir acesso seguro ao Servidor 360.

**Pré-condição:** Usuário cadastrado e ativo.

**Fluxo principal:**
1. Usuário informa suas credenciais.
2. Sistema valida a identidade.
3. Sistema identifica perfil e permissões.
4. Sistema inicia a sessão.
5. Sistema apresenta a página inicial personalizada.

**Fluxos alternativos:**
- credenciais inválidas;
- usuário inativo;
- usuário sem autorização.

**Pós-condição:** Usuário autenticado com as permissões correspondentes.

---

## UC-G02 — Consultar Servidor

**Ator:** Usuário Autorizado.

**Objetivo:** Localizar um servidor dentro do escopo permitido.

**Fluxo principal:**
1. Usuário acessa a busca.
2. Informa nome ou matrícula.
3. Sistema aplica as restrições de acesso.
4. Sistema apresenta os resultados permitidos.
5. Usuário seleciona o servidor.

---

## UC-G03 — Consultar Prontuário Funcional

**Ator:** Usuário Autorizado.

**Objetivo:** Consultar as informações funcionais autorizadas.

**Fluxo principal:**
1. Usuário localiza o servidor.
2. Acessa o prontuário.
3. Sistema valida as permissões.
4. Sistema exibe somente as categorias autorizadas.

**Regra:** acesso ao prontuário funcional não concede acesso automático ao prontuário médico/ocupacional.

---

## UC-G04 — Consultar Documentos

**Ator:** Usuário Autorizado.

**Objetivo:** Consultar documentos conforme sua permissão.

**Fluxo principal:**
1. Usuário acessa o prontuário ou processo.
2. Sistema identifica os documentos relacionados.
3. Sistema valida o acesso.
4. Sistema apresenta somente os documentos autorizados.

---

## UC-G05 — Consultar Histórico

**Ator:** Usuário Autorizado.

**Objetivo:** Visualizar acontecimentos e movimentações autorizadas.

**Fluxo principal:**
1. Usuário acessa o histórico.
2. Sistema valida o nível de acesso.
3. Sistema apresenta os eventos em ordem cronológica.

---

## UC-G06 — Consultar Pendências

**Ator:** Usuário Autorizado.

**Objetivo:** Visualizar atividades que dependem de sua atuação.

**Fluxo principal:**
1. Usuário acessa a página inicial.
2. Sistema consulta pendências dos módulos.
3. Sistema apresenta somente aquelas atribuídas ao usuário.

---

## UC-G07 — Consultar Indicadores

**Ator:** Gestor Autorizado.

**Objetivo:** Acompanhar informações gerenciais consolidadas.

**Regra:** indicadores não deverão expor conteúdo restrito sem finalidade e autorização.

---

## UC-G08 — Gerenciar Usuários

**Ator:** Administrador.

**Objetivo:** Cadastrar e manter usuários autorizados.

---

## UC-G09 — Gerenciar Perfis e Permissões

**Ator:** Administrador.

**Objetivo:** Configurar quais recursos cada perfil poderá acessar.

---

## UC-G10 — Gerenciar Unidades e Setores

**Ator:** Administrador.

**Objetivo:** Manter unidades e setores utilizados para controle de acesso e tramitação.
