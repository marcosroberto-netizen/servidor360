# Servidor 360 — Status e Checklists por Módulo

Este documento resume o que já existe no projeto e o que ainda falta para concluir o MVP. Ele deve ser usado como ponte entre requisitos, casos de uso, arquitetura e implementação.

## Visão Geral

| Área | Status | Observação |
|---|---|---|
| Base do frontend | Em andamento | React, Vite, rotas protegidas, providers e layout base já existem. |
| Autenticação e autorização | Em andamento | Login, logout, recuperação de senha, sessão, RBAC e RLS implementados. Faltam telas administrativas completas. |
| Portal | Em andamento | Página inicial lista cards conforme permissões. Parte dos cards ainda não navega para telas finais. |
| Servidores e prontuários | Parcial | Estrutura de banco, seeds e consulta para afastamentos existem. Faltam telas próprias de gestão e prontuário. |
| Documentos | Parcial | Storage de documentos de afastamentos existe. Falta módulo global de documentos/prontuário. |
| Afastamentos | Avançado | Fluxo principal, documentos, complementação, devolutiva, providência, assinatura digital e validação por protocolo existem. |
| Indicadores | Planejado | Requisitos existem, mas ainda não há implementação dedicada. |

## Módulo Global / Núcleo

### Feito

- [x] Estrutura React com rotas em `src/app/routes`.
- [x] Providers globais com autenticação e TanStack Query.
- [x] Cliente Supabase configurado com validação de ambiente.
- [x] Autenticação por e-mail/senha.
- [x] Recuperação e redefinição de senha.
- [x] Rotas protegidas por sessão e permissão.
- [x] Componente `Can` para renderização condicional por permissão.
- [x] RBAC com usuários, perfis, permissões, unidades e setores no schema `app_auth`.
- [x] Função `get_current_user_authz()` para carregar autorização do usuário.
- [x] RLS e funções auxiliares para validar permissão e escopo.
- [x] Portal inicial com cards por permissão.

### Falta para concluir

- [ ] Criar telas administrativas para usuários, perfis, permissões, unidades e setores.
- [ ] Criar tela global de consulta/gestão de servidores.
- [ ] Criar tela de prontuário funcional do servidor.
- [ ] Criar módulo global de documentos fora do fluxo de afastamentos.
- [ ] Criar histórico/auditoria global independente dos eventos de afastamento.
- [ ] Criar indicadores gerais.
- [ ] Adicionar testes automatizados para autenticação, autorização e rotas protegidas.

## Módulo de Servidores e Prontuários

### Feito

- [x] Schema `servidores`.
- [x] Tabelas base de servidores e prontuários.
- [x] Seeds para servidores de demonstração.
- [x] Consulta de servidores no contexto do módulo de afastamentos.
- [x] Escopo por unidade aplicado para gestores escolares.
- [x] Criação/atualização automática de prontuário ao criar afastamento.

### Falta para concluir

- [ ] CRUD completo de servidores.
- [ ] Consulta centralizada por nome e matrícula fora do módulo de afastamentos.
- [ ] Tela detalhada do servidor.
- [ ] Tela do prontuário funcional com timeline consolidada.
- [ ] Categorias globais de documentos do prontuário.
- [ ] Regras de acesso refinadas por tipo de informação funcional, administrativa e ocupacional.

## Módulo de Afastamentos

### Feito

- [x] Schema `afastamentos`.
- [x] Tabela principal de afastamentos com status, protocolo, período, motivo e documento de origem.
- [x] Criação de afastamento via RPC `criar_afastamento`.
- [x] Geração de protocolo `AF-AAAA-000000`.
- [x] Upload de documento de origem em bucket privado `afastamentos-documentos`.
- [x] Listagem de afastamentos.
- [x] Detalhe do afastamento com movimentações, complementações, devolutivas, providências e documentos digitais.
- [x] Registro de análise pelo CAS.
- [x] Solicitação e resposta de complementação.
- [x] Emissão de devolutiva.
- [x] Registro de providência administrativa.
- [x] Conclusão de processo com bloqueio para complementação pendente.
- [x] Linha do tempo por movimentações.
- [x] Alertas de devolutivas no portal.
- [x] Controle de visualização de devolutivas por permissão.
- [x] Documento digital com hash SHA-256.
- [x] Assinatura eletrônica interna com confirmação de senha no frontend.
- [x] Validação de documento digital por protocolo.
- [x] RLS para afastamentos, documentos, devolutivas e assinaturas digitais.

### Falta para concluir

- [ ] Refinar filtros por fila/perfil: CAS, RH, gestor escolar, médico/profissional autorizado.
- [ ] Separar telas específicas de fila do CAS e fila do RH, em vez de depender apenas da tela geral.
- [ ] Melhorar busca e filtros avançados por servidor, protocolo, status, unidade e período.
- [ ] Definir versão/substituição de documento digital na interface.
- [ ] Permitir validação por QR Code de forma completa, incluindo leitura/rota pública ou controlada conforme decisão de segurança.
- [ ] Criar testes de integração para os RPCs principais.
- [ ] Criar testes de UI para criação, complementação, devolutiva, providência, assinatura e validação.
- [ ] Revisar mensagens e estados vazios para cada perfil.

## Módulo de Documentos

### Feito

- [x] Bucket privado para documentos de afastamentos.
- [x] Política de upload para criação/complementação de afastamentos.
- [x] Política de leitura conforme permissões de afastamento.
- [x] Preview/abertura de documentos de afastamento por URL assinada.
- [x] Documento digital assinável para afastamentos.

### Falta para concluir

- [ ] Criar módulo global de documentos do prontuário.
- [ ] Definir categorias, metadados, versionamento e retenção.
- [ ] Criar upload/consulta global com permissão por categoria.
- [ ] Integrar documentos globais à timeline do prontuário.
- [ ] Criar auditoria de acesso a documentos sensíveis.

## Módulo de Indicadores

### Feito

- [x] Requisitos gerais definidos.
- [x] Portal possui card condicionado por permissão.

### Falta para concluir

- [ ] Definir indicadores do MVP.
- [ ] Criar consultas agregadas no Supabase.
- [ ] Criar telas de indicadores.
- [ ] Garantir anonimização/agregação quando houver dados sensíveis.

## Checklist de Qualidade Antes de Fechar o MVP

- [ ] `pnpm lint` sem erros.
- [ ] `pnpm build` sem erros.
- [ ] Fluxo de login/logout validado manualmente.
- [ ] Criação de afastamento validada por perfil autorizado.
- [ ] Bloqueio de escopo por unidade validado.
- [ ] Leitura de documentos validada com usuário permitido e não permitido.
- [ ] Devolutiva visível apenas para perfis autorizados.
- [ ] Assinatura digital validada com senha correta e senha incorreta.
- [ ] Validação de documento por protocolo validada.
- [ ] Documentação revisada sempre que uma tabela, permissão, rota ou fluxo mudar.
