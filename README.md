# Servidor 360

Portal central para gestão da vida funcional do servidor.

## 🎯 Visão Geral

O **Servidor 360** é um sistema que substitui a dependência de pastas físicas, arquivos dispersos, planilhas e e-mails por um ambiente digital único, organizado, seguro e de fácil consulta.

Seu objetivo é reunir documentos, registros, movimentações, processos e históricos funcionais em um **Prontuário Funcional Digital**.

### Conceito Principal

> **Um único portal, com a informação certa para a pessoa certa.**

Cada usuário acessa o mesmo portal, mas visualiza somente os módulos, informações e ações compatíveis com suas atribuições e permissões.

## 🚀 Tecnologias

Este projeto utiliza a stack abaixo, conforme o `package.json` atual:

- **Framework**: React 19 + TypeScript 6
- **Build**: Vite 8
- **Backend**: Supabase Auth, PostgreSQL, RLS e Storage
- **Estado de Servidor**: TanStack Query
- **Formulários**: React Hook Form + Zod
- **Roteamento**: React Router v7
- **UI**: Tailwind CSS + componentes próprios em `shared/components/ui`
- **Lint**: ESLint

## 📚 Documentação

A documentação completa do projeto está disponível na pasta [`docs/`](docs/):

- [Documentação Oficial](docs/README.md) — Índice completo da documentação
- [Status e Checklists](docs/01-status/README.md) — O que já foi feito e o que falta por módulo
- [Descrição Geral](docs/00-descricao/02-descricao-geral.md) — Visão do produto
- [Requisitos Globais](docs/02-requisitos/global/01-requisitos-globais.md) — Requisitos do núcleo
- [Casos de Uso](docs/03-casos-de-uso/global/03-casos-de-uso-globais.md) — Interações do sistema
- [Arquitetura](docs/04-arquitetura/README.md) — Organização técnica, dados e autorização

## 🏗️ Estrutura do Projeto

```
servidor360/
├── docs/                   # Documentação do projeto
├── src/
│   ├── app/               # Configurações globais (providers, routes)
│   ├── shared/            # Componentes, hooks, utils compartilhados
│   ├── features/          # Módulos de negócio isolados
│   └── pages/             # Orquestração de páginas
└── public/                # Arquivos estáticos
```

## 🔧 Scripts Disponíveis

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Executar testes
pnpm test

# Lint
pnpm lint
```

## 📋 MVP

O MVP atual está concentrado em:

- Portal autenticado com acesso por permissões
- RBAC com perfis, permissões, unidades e setores
- Cadastro base de servidores e prontuários via Supabase
- Módulo de afastamentos com criação, análise, complementação, devolutiva, providência e conclusão
- Documentos de afastamento em Storage com política de acesso
- Documento digital, assinatura eletrônica interna e validação por protocolo

## 🎓 Regras de Arquitetura

Este projeto segue uma organização modular:

- Isolamento de features (apenas exports via `index.ts`)
- Separação clara entre estado de servidor (TanStack Query) e estado local de UI
- Componentes UI compartilhados em `shared/components/ui/`
- Query key factories para consistência de cache
- Lazy loading obrigatório para rotas
- Validação de variáveis de ambiente com Zod
- Schemas do banco separados por domínio: `app_auth`, `organizacional`, `servidores` e `afastamentos`

## 📝 Status

- 🚧 **Em desenvolvimento** — MVP funcional em evolução
- 📖 **Documentação** — Reorganizada com status/checklists por módulo
- 🏗️ **Arquitetura** — Implementada com React, Supabase, RLS, Storage e RPCs

---

**Servidor 360 — Toda a vida funcional. Um único lugar. Acesso certo para cada responsabilidade.**
