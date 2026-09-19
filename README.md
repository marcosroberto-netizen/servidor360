# Servidor 360

Portal React para registrar e acompanhar a vida funcional de servidores. O MVP concentra o fluxo de afastamentos, com controle de acesso por perfil, unidade e setor.

## Stack

- React 19, TypeScript 6 e Vite 8
- React Router 7 e TanStack Query 5
- React Hook Form, Zod, Zustand e Tailwind CSS
- Supabase Auth, PostgreSQL, Row-Level Security (RLS), RPCs e Storage

## Executar localmente

Requisitos: Node.js 20 ou superior, pnpm 10.28.1 e um projeto Supabase configurado.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Preencha as variáveis de [`.env.example`](.env.example). O frontend valida a configuração na inicialização. Consulte o [guia de desenvolvimento](docs/development.md) para migrations e validações.

## Comandos

```bash
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

O `package.json` não define script de testes automatizados.

## Estrutura

```text
src/app/         providers e rotas
src/features/    auth e módulos de negócio
src/pages/       páginas globais
src/shared/      componentes e bibliotecas compartilhadas
supabase/        configuração e migrations imperativas
docs/            documentação canônica e artefatos auxiliares
```

## Documentação

- [Arquitetura](docs/architecture.md): camadas, rotas, autenticação e autorização
- [Banco de dados](docs/database.md): schemas, entidades, RLS, Storage e RPCs
- [Desenvolvimento](docs/development.md): requisitos, ambiente e validação
- [Deploy](docs/deployment.md): build e publicação na Vercel
- [Fluxos e status](docs/flows.md): comportamento implementado e backlog conhecido
- [Decisões](docs/decisions.md): decisões que orientam a manutenção
- [Usuários de teste](docs/usuarios-teste.md): contas de desenvolvimento e demonstração

Materiais de apresentação e entregas acadêmicas ficam em [`docs/apresentacoes/`](docs/apresentacoes/) e [`docs/entregas/`]. Eles não são a referência técnica do sistema.
