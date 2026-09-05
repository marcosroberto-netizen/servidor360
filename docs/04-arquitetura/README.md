# Servidor 360 — Arquitetura Técnica

Esta pasta contém a documentação técnica do Servidor 360, incluindo diagramas, modelos de dados e arquitetura do sistema.

## 📋 Conteúdo

- [Diagrama de Classes](01-diagrama-classes.md) — Estrutura conceitual do software em UML
- [Modelo de Dados](02-modelo-dados.md) — DER, tabelas e relacionamentos do banco de dados
- [Arquitetura do Sistema](03-arquitetura.md) — Organização técnica das camadas e decisões arquiteturais

## 🎯 Objetivo

A documentação técnica tem como objetivo:

- Fornecer uma visão clara da estrutura do sistema
- Definir o modelo de dados para implementação
- Documentar decisões arquiteturais importantes
- Servir como referência para desenvolvedores

## 📐 Padrões

### Diagramas UML
Todos os diagramas seguem o padrão UML 2.0 e são renderizados com Mermaid:
- Diagramas de classes para estrutura
- Diagramas de sequência para fluxos
- Diagramas de entidade-relacionamento para modelo de dados

### Nomenclatura
- Classes em PascalCase (ex: `Usuario`, `Prontuario`)
- Tabelas em UPPERCASE (ex: `USUARIO`, `PRONTUARIO`)
- Colunas em snake_case (ex: `usuario_id`, `data_criacao`)
- Atributos em camelCase (ex: `usuarioId`, `dataCriacao`)

### Convenções
- IDs sempre são UUID
- Timestamps em UTC
- Campos booleanos com prefixo `is_` ou `has_` quando apropriado
- Chaves estrangeiras com sufixo `_id`

## 🔗 Integração com Requisitos

A arquitetura técnica implementa diretamente os requisitos definidos em:

- [Requisitos Globais](../02-requisitos/global/01-requisitos-globais.md)
- [Requisitos do Módulo de Afastamentos](../02-requisitos/modulos/afastamentos/01-requisitos-afastamentos.md)

## 🚀 Próximos Passos

Após revisar a arquitetura técnica:

1. Configurar o banco de dados conforme o modelo de dados
2. Implementar as classes conforme o diagrama
3. Seguir a arquitetura definida para desenvolvimento
4. Consultar as [Regras Globais do React Stack](../../.codeium/windsurf/memories/global_rules.md) para implementação

---

**Nota:** Esta documentação técnica complementa a documentação de requisitos e casos de uso, fornecendo os detalhes necessários para implementação.
