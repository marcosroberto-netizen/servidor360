# Servidor 360 - Instrucoes para agentes

## Contexto do projeto

- Frontend: React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form e Zod.
- Backend: Supabase Auth, PostgreSQL, RPCs, RLS e Storage.
- UI: Tailwind CSS e componentes compartilhados em `src/shared/components`.
- Arquitetura: features por dominio em `src/features/<modulo>`, com API publica via `index.ts`.
- Banco: migrations imperativas em `supabase/migrations`; schemas de negocio separados de `public`.
- Ambiente de banco: este repositorio esta vinculado a um projeto Supabase remoto pela CLI.

## Convenções essenciais

- Leia `docs/architecture.md` e `docs/database.md` antes de alterar arquitetura, banco, auth, permissoes ou fluxos de modulo.
- Importe features preferencialmente pela API publica em `@/features/<feature>`.
- Coloque chamadas Supabase em `services`, hooks de consulta/mutation em `hooks`, tipos de dominio em `types` e componentes compartilhados em `shared`.
- Novas acoes sensiveis devem validar permissao no banco, nao apenas no frontend.
- Novas tabelas de modulo nao devem ser criadas em `public`; use `public` para RPCs/fachadas quando necessario.
- Antes de encerrar mudancas de codigo, rode pelo menos `pnpm lint` e `pnpm build` quando a alteracao afetar TypeScript, UI, rotas, Supabase ou bundling.

## Migrations do Supabase

- Quando o usuario pedir para criar, fazer ou aplicar uma migration, use por padrao o projeto Supabase remoto ja vinculado. Nao tente iniciar o banco local ou o Docker, salvo se o usuario pedir validacao local.
- Siga o procedimento documentado em `docs/development.md` e a referencia de modelo em `docs/database.md`.
- Crie migrations imperativas com `supabase migration new <nome_descritivo>` e edite apenas o arquivo gerado em `supabase/migrations`.
- Antes de aplicar, confira o historico com `supabase migration list` e execute `supabase db push --linked --dry-run`.
- Se a previa listar somente as migrations esperadas, aplique com `supabase db push --linked --yes`.
- Depois da aplicacao, confirme com `supabase migration list`, execute uma consulta de verificacao quando aplicavel e rode `supabase db advisors --linked` para mudancas sensiveis de banco.
- Nunca use `supabase db reset` no projeto remoto.

## Skills do projeto

- Quando o pedido for criar ou alterar uma pagina, tela, formulario, modal, tabela, dashboard ou fluxo visual, acione automaticamente este fluxo:
  1. Use `web-design-guidelines` para orientar UI, UX, acessibilidade, hierarquia visual e consistencia com o produto.
  2. Use `vercel-composition-patterns` se a tela exigir componentes reutilizaveis, formulario complexo, modal, tabela, cards repetidos ou muita variacao de estado.
  3. Use `vercel-react-best-practices` para implementar ou revisar o React/TypeScript, hooks, renderizacao, performance e organizacao frontend.
  4. Use `supabase` e `supabase-postgres-best-practices` tambem quando a tela envolver dados, Auth, permissoes, RPCs, RLS, Storage ou migrations.
  5. Use `security-best-practices` tambem quando a tela lidar com dados sensiveis, documentos, assinatura digital, upload, autorizacao ou armazenamento local.
- O usuario nao precisa citar as Skills pelo nome quando o pedido deixar claro o tipo de trabalho; aplique as Skills adequadas de forma implicita e mencione brevemente quais foram usadas.
- Use `supabase` para qualquer tarefa envolvendo Supabase, Auth, Storage, RPCs, RLS, migrations, CLI ou troubleshooting de cliente Supabase.
- Use `supabase-postgres-best-practices` antes de escrever ou revisar SQL, migrations, schemas, RLS, policies, indices, funcoes, triggers ou performance de Postgres.
- Use `vercel-react-best-practices` ao criar, revisar ou refatorar componentes React, hooks, data fetching, renderizacao, bundle/performance ou padroes React 19.
- Use `vercel-composition-patterns` ao desenhar/refatorar componentes reutilizaveis, APIs de componentes, context providers, compound components ou quando houver proliferacao de boolean props.
- Use `web-design-guidelines` para auditoria de UI, UX, acessibilidade e consistencia visual em arquivos especificos.
- Use `writing-guidelines` para revisar documentacao, README, textos de requisitos, casos de uso, arquitetura, voz, tom e clareza de escrita.
- Use `security-best-practices` quando a tarefa pedir seguranca, hardening, auditoria, ou quando houver alteracao sensivel em auth, armazenamento local, dados pessoais, rotas protegidas ou superficies de upload.
- Use `security-threat-model` somente quando o pedido for modelagem de ameacas, abuso, AppSec ou enumeracao de riscos arquiteturais.

## Cuidados de seguranca

- Nunca exponha `service_role`, segredos Supabase ou tokens privados no frontend.
- Trate variaveis `VITE_*` como publicas.
- Ao tocar em RLS ou RPCs `SECURITY DEFINER`, revise grants, escopo, `auth.uid()` e exposicao em `public`.
- Para documentos, assinaturas e informacao ocupacional, preserve trilha de auditoria e validacao server-side.
