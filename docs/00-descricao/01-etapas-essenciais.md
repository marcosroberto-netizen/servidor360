# Servidor 360 — Etapas Essenciais do Projeto

Este documento define a ordem recomendada para leitura, manutenção e evolução da documentação do **Servidor 360**.

## Estrutura

```text
servidor360/
├── docs/
│   ├── 00-descricao/
│   ├── 01-status/
│   ├── 02-requisitos/
│   ├── 03-casos-de-uso/
│   └── 04-arquitetura/
└── README.md
```

## 1. Visão do Produto

**Arquivos:** `docs/00-descricao/`

Descrever de forma objetiva:

- problema que o Servidor 360 pretende resolver;
- objetivo do sistema;
- público-alvo;
- funcionamento geral do portal;
- prontuário funcional digital;
- controle de acesso por perfil;
- fluxo inicial de afastamentos, CAS e RH;
- escopo inicial do produto.

**Resultado:** definição clara do que é o Servidor 360 e qual problema ele resolve.

## 2. Status e Checklists

**Arquivo:** `docs/01-status/README.md`

Registrar, por módulo:

- o que já foi implementado;
- o que falta para concluir;
- pontos de validação antes de fechar o MVP.

**Resultado:** visão prática e navegável do andamento do projeto.

## 3. Requisitos

**Arquivos:** `docs/02-requisitos/`

Centralizar em um único documento:

- requisitos funcionais;
- requisitos não funcionais;
- regras de negócio;
- perfis de usuários;
- permissões de acesso;
- restrições importantes de segurança e privacidade.

**Resultado:** definição objetiva do que o sistema deverá fazer e das principais regras que deverão ser respeitadas.

## 4. Casos de Uso

**Arquivos:** `docs/03-casos-de-uso/`

Definir os principais atores e suas ações no sistema.

Principais atores:

- Diretor/Unidade Escolar;
- Educação;
- CAS;
- Médico/Profissional autorizado;
- RH;
- Administrador.

Principais ações:

- autenticar no portal;
- localizar servidor;
- consultar informações autorizadas;
- registrar afastamento;
- acompanhar processo;
- analisar documentação;
- solicitar complementação;
- emitir devolutiva;
- realizar providência administrativa;
- consultar histórico.

**Resultado:** visão clara de quem utiliza o sistema e quais operações cada perfil realiza.

## 5. Arquitetura

**Arquivos:** `docs/04-arquitetura/`

Definir de forma simples a organização técnica do sistema:

```text
USUÁRIO
   ↓
FRONTEND REACT
   ↓
SUPABASE AUTH / RPC / STORAGE
   ↓
POSTGRESQL COM RLS
```

Descrever brevemente:

- responsabilidade do frontend;
- comunicação com Supabase;
- banco de dados por schemas;
- autenticação e autorização;
- armazenamento de documentos;
- proteção das informações funcionais e ocupacionais.

**Resultado:** visão técnica necessária para manter o desenvolvimento organizado.

## Sequência de Manutenção

Ao alterar o projeto, siga esta ordem:

1. Atualize ou confirme o requisito afetado.
2. Atualize o checklist do módulo.
3. Atualize casos de uso se o fluxo do usuário mudar.
4. Atualize arquitetura/modelo de dados se houver tabela, RPC, permissão, rota ou regra nova.
5. Implemente ou ajuste o código.
6. Rode validações (`pnpm lint` e `pnpm build`) quando aplicável.

## Objetivo

A documentação deve ser curta, objetiva e suficiente para orientar o desenvolvimento sem virar um segundo sistema paralelo.

O foco do MVP é demonstrar: **portal + controle de acesso + base de servidores/prontuário + afastamentos + CAS + devolutiva + RH + histórico + documento digital assinado.**
