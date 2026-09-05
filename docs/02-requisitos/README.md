# Servidor 360 — Organização dos Requisitos

Esta pasta concentra a documentação de requisitos do **Servidor 360**, separando claramente o que pertence ao **núcleo global da plataforma** do que pertence a cada **módulo de negócio**.

> **Nota:** Casos de uso são documentados separadamente em [`../03-casos-de-uso/`](../03-casos-de-uso/).

## Estrutura

```text
requisitos/
├── README.md
├── global/
│   └── 01-REQUISITOS-GLOBAIS.md
└── modulos/
    ├── afastamentos/
    │   └── 01-REQUISITOS-AFASTAMENTOS.md
    ├── autenticacao/
    │   └── 01-REQUISITOS-AUTENTICACAO.md
    └── autorizacao/
        └── 01-REQUISITOS-AUTORIZACAO.md
```

## Princípio de organização

### Global
Contém somente funcionalidades e regras compartilhadas por toda a plataforma, como:

- autenticação;
- usuários;
- perfis e permissões;
- unidades e setores;
- servidores;
- prontuário funcional;
- documentos;
- histórico;
- rastreabilidade;
- busca;
- segurança e privacidade;
- indicadores gerais.

### Módulos
Cada módulo deverá possuir seus próprios requisitos funcionais, não funcionais e regras de negócio.

O primeiro módulo é **Afastamentos**, responsável por:

- registro de afastamento;
- documentos relacionados;
- tramitação;
- CAS;
- avaliação;
- complementação;
- devolutiva;
- providência do RH;
- conclusão.

## Regra para novos módulos

Novos módulos deverão ser criados dentro de `requisitos/modulos/`, por exemplo:

```text
modulos/
├── afastamentos/
├── ferias/
├── capacitacoes/
└── avaliacoes/
```

O módulo poderá utilizar funcionalidades globais, mas não deverá duplicar responsabilidades do núcleo da plataforma.
