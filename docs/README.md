# Servidor 360 — Documentação

Bem-vindo à documentação oficial do **Servidor 360**, o portal central para gestão da vida funcional do servidor.

## 📋 Índice da Documentação

A documentação está organizada em camadas progressivas,从 visão geral até detalhes técnicos:

### 🎯 00 — Descrição Geral
Visão geral do produto, conceitos e escopo do projeto.

- [Etapas Essenciais do Projeto](00-descricao/01-etapas-essenciais.md) — Sequência de trabalho e estrutura da documentação
- [Descrição Geral do Servidor 360](00-descricao/02-descricao-geral.md) — Visão do produto, conceito do portal, prontuário funcional digital
- [Módulo de Afastamentos](00-descricao/03-modulo-afastamentos.md) — Descrição específica do primeiro módulo

### 📐 02 — Requisitos
Definição detalhada dos requisitos funcionais, não funcionais e regras de negócio.

#### Requisitos Globais
Recursos compartilhados por toda a plataforma:
- [Requisitos Globais](02-requisitos/global/01-requisitos-globais.md) — Requisitos do núcleo global (autenticação, usuários, prontuário, etc.)

#### Requisitos por Módulo
Cada módulo possui seus próprios requisitos específicos:
- [Módulo de Afastamentos](02-requisitos/modulos/afastamentos/01-requisitos-afastamentos.md)

### 🎭 03 — Casos de Uso
Documentação dos atores e casos de uso do sistema.

#### Casos de Uso Globais
- [Atores Globais](03-casos-de-uso/global/01-atores-globais.md) — Usuários que interagem com o núcleo global
- [Diagrama de Casos de Uso Global](03-casos-de-uso/global/02-diagrama-casos-de-uso-global.md) — Diagrama UML dos casos de uso globais
- [Casos de Uso Globais Detalhados](03-casos-de-uso/global/03-casos-de-uso-globais.md) — Descrição detalhada de cada caso de uso global

#### Casos de Uso por Módulo
- [Módulo de Afastamentos](03-casos-de-uso/modulos/afastamentos/)

### 🏗️ 04 — Arquitetura Técnica
Documentação técnica para implementação:

- [Diagrama de Classes](04-arquitetura/01-diagrama-classes.md) — Estrutura conceitual do software
- [Modelo de Dados](04-arquitetura/02-modelo-dados.md) — DER e organização do banco de dados
- [Arquitetura do Sistema](04-arquitetura/03-arquitetura.md) — Organização técnica das camadas

## 🚀 Como Navegar

1. **Comece pela Descrição Geral** para entender o produto
2. **Leia os Requisitos Globais** para compreender o núcleo da plataforma
3. **Explore os Casos de Uso** para entender as interações dos usuários
4. **Consulte os Requisitos dos Módulos** para detalhes específicos
5. **Revise a Arquitetura Técnica** quando for iniciar o desenvolvimento

## 📊 Estrutura do Projeto

```text
docs/
├── 00-descricao/          # Visão geral e conceitos
├── 02-requisitos/         # Requisitos funcionais e não funcionais
│   ├── global/           # Requisitos do núcleo global
│   └── modulos/          # Requisitos específicos por módulo
├── 03-casos-de-uso/       # Atores e casos de uso
│   ├── global/           # Casos de uso do núcleo global
│   └── modulos/          # Casos de uso específicos por módulo
└── 04-arquitetura/        # Documentação técnica (em desenvolvimento)
```

## 🎯 Princípios de Organização

### Separação Global vs Módulos
- **Global**: Funcionalidades compartilhadas por toda a plataforma (autenticação, usuários, prontuário, etc.)
- **Módulos**: Funcionalidades específicas de cada domínio de negócio (afastamentos, férias, etc.)

### Prontuário Funcional Digital
O Servidor 360 organiza a vida funcional do servidor em um prontuário digital unificado, com:
- Controle de acesso por perfil
- Separação entre informações funcionais e médico/ocupacionais
- Histórico e rastreabilidade completa
- Integração entre módulos

### Modularidade
Cada módulo é independente mas utiliza os recursos globais, evitando duplicação de responsabilidades.

## 📝 Status da Documentação

| Seção | Status |
|-------|--------|
| Descrição Geral | ✅ Completo |
| Requisitos Globais | ✅ Completo |
| Requisitos por Módulo | 🚧 Em desenvolvimento |
| Casos de Uso Globais | ✅ Completo |
| Casos de Uso por Módulo | 🚧 Em desenvolvimento |
| Arquitetura Técnica | ✅ Completo |
| Guia de Contribuição | ✅ Completo |

## 🔗 Recursos Adicionais

- [React Stack Rules](../../.codeium/windsurf/memories/global_rules.md) — Regras de arquitetura para implementação
- [Package.json](../../package.json) — Dependências e scripts do projeto
- [Guia de Contribuição](CONTRIBUTING.md) — Padrões e convenções para documentação

---

**Servidor 360 — Toda a vida funcional. Um único lugar. Acesso certo para cada responsabilidade.**
