# Servidor 360 — Arquitetura Técnica

Esta pasta contém a documentação técnica do Servidor 360, incluindo diagramas, modelos de dados e arquitetura do sistema.

## Conteúdo

- [Diagrama de Classes](01-diagrama-classes.md) — Estrutura conceitual do software em UML
- [Modelo de Dados](02-modelo-dados.md) — Schemas, tabelas, relacionamentos e RPCs
- [Arquitetura do Sistema](03-arquitetura.md) — Organização técnica das camadas e decisões arquiteturais
- [Autenticação e Autorização](04-autenticacao-autorizacao.md) — Supabase Auth, RBAC, permissões, escopo e RLS

## Objetivo

A documentação técnica tem como objetivo:

- Fornecer uma visão clara da estrutura do sistema
- Definir o modelo de dados para implementação
- Documentar decisões arquiteturais importantes
- Servir como referência para desenvolvedores

## Padrões

### Diagramas
Os diagramas são renderizados com Mermaid quando possível:

- diagramas de classes para estrutura conceitual;
- diagramas de sequência para fluxos;
- diagramas entidade-relacionamento para modelo de dados;
- fluxogramas para arquitetura e autorização.

### Nomenclatura
- Classes em PascalCase (ex: `Usuario`, `Prontuario`)
- Schemas e tabelas em snake_case (ex: `app_auth.usuarios`, `afastamentos.documentos_digitais`)
- Colunas em snake_case (ex: `usuario_id`, `data_criacao`)
- Atributos em camelCase (ex: `usuarioId`, `dataCriacao`)

### Convenções
- IDs sempre são UUID
- Timestamps em UTC
- Campos booleanos com prefixo `is_` ou `has_` quando apropriado
- Chaves estrangeiras com sufixo `_id`

## Integração com Requisitos

A arquitetura técnica implementa diretamente os requisitos definidos em:

- [Requisitos Globais](../02-requisitos/global/01-requisitos-globais.md)
- [Requisitos do Módulo de Afastamentos](../02-requisitos/modulos/afastamentos/01-requisitos-afastamentos.md)

## Próximos Passos

Após revisar a arquitetura técnica:

1. Verifique o [Status e Checklists](../01-status/README.md).
2. Confirme se a mudança exige migration, nova permissão ou ajuste de RLS.
3. Atualize o modelo de dados quando alterar schemas, tabelas ou RPCs.
4. Atualize os requisitos/casos de uso quando mudar comportamento de usuário.

---

**Nota:** Esta documentação técnica complementa a documentação de requisitos, casos de uso e status. Em caso de divergência, confira primeiro as migrations e o código atual.
