# Servidor 360

Portal central para gestão da vida funcional do servidor.

## 🎯 Visão Geral

O **Servidor 360** é um sistema que substitui a dependência de pastas físicas, arquivos dispersos, planilhas e e-mails por um ambiente digital único, organizado, seguro e de fácil consulta.

Seu objetivo é reunir documentos, registros, movimentações, processos e históricos funcionais em um **Prontuário Funcional Digital**.

### Conceito Principal

> **Um único portal, com a informação certa para a pessoa certa.**

Cada usuário acessa o mesmo portal, mas visualiza somente os módulos, informações e ações compatíveis com suas atribuições e permissões.

## 🚀 Tecnologias

Este projeto utiliza o stack tecnológico React definido nas regras globais:

- **Framework**: React 18 + TypeScript 5
- **Build**: Vite 6
- **Estado Global (Client)**: Zustand
- **Estado de Servidor**: TanStack Query
- **UI Components**: shadcn/ui + Radix UI
- **Formulários**: React Hook Form + Zod
- **Roteamento**: React Router v7
- **Testes**: Vitest + Testing Library
- **Lint**: ESLint + eslint-plugin-boundaries
- **Formatação**: Prettier

## 📚 Documentação

A documentação completa do projeto está disponível na pasta [`docs/`](docs/):

- [Documentação Oficial](docs/README.md) — Índice completo da documentação
- [Descrição Geral](docs/00-descricao/Servidor_360_Descricao_Geral.md) — Visão do produto
- [Requisitos Globais](docs/02-requisitos/global/01-REQUISITOS-GLOBAIS.md) — Requisitos do núcleo
- [Casos de Uso](docs/03-casos-de-uso/global/03-CASOS-DE-USO-GLOBAIS.md) — Interações do sistema

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

O primeiro MVP validará:
- Portal único
- Autenticação
- Controle de acesso
- Cadastro e consulta de servidores
- Prontuário funcional
- Documentos
- Histórico e rastreabilidade
- Módulo de afastamentos

## 🎓 Regras de Arquitetura

Este projeto segue estritamente as regras definidas em [`.codeium/windsurf/memories/global_rules.md`](.codeium/windsurf/memories/global_rules.md), incluindo:

- Isolamento de features (apenas exports via `index.ts`)
- Separação clara entre server state (TanStack Query) e client state (Zustand)
- Componentes UI compartilhados em `shared/components/ui/`
- Query key factories para consistência de cache
- Lazy loading obrigatório para rotas
- Validação de variáveis de ambiente com Zod

## 📝 Status

- 🚧 **Em Desenvolvimento** — MVP em construção
- 📖 **Documentação** — Requisitos e casos de uso definidos
- 🏗️ **Arquitetura** — Estrutura técnica planejada

---

**Servidor 360 — Toda a vida funcional. Um único lugar. Acesso certo para cada responsabilidade.**
