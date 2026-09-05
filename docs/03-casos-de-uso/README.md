# Servidor 360 — Organização dos Casos de Uso

Esta pasta concentra a documentação oficial de **Casos de Uso** do Servidor 360.

A organização separa os casos de uso pertencentes ao **núcleo global da plataforma** daqueles específicos de cada **módulo de negócio**.

## Estrutura

```text
casos-de-uso/
├── README.md
├── global/
│   ├── 01-ATORES-GLOBAIS.md
│   ├── 02-DIAGRAMA-CASOS-DE-USO-GLOBAL.md
│   └── 03-CASOS-DE-USO-GLOBAIS.md
└── modulos/
    └── afastamentos/
        ├── 01-ATORES-AFASTAMENTOS.md
        ├── 02-DIAGRAMA-CASOS-DE-USO-AFASTAMENTOS.md
        └── 03-CASOS-DE-USO-AFASTAMENTOS.md
```

## Regra de Organização

### Núcleo Global

O núcleo global contém somente interações que podem ser reutilizadas por diferentes módulos, como:

- autenticação;
- consulta de servidor;
- consulta de prontuário;
- consulta de documentos;
- histórico;
- pendências;
- indicadores;
- gestão de usuários;
- gestão de perfis e permissões;
- gestão de unidades e setores.

### Módulos

Cada módulo possui atores, diagrama e casos de uso próprios.

O módulo de **Afastamentos** contém:

- registrar afastamento;
- acompanhar processo;
- responder complementação;
- analisar processo;
- solicitar complementação;
- encaminhar para avaliação;
- emitir devolutiva;
- consultar devolutiva;
- registrar providência administrativa;
- concluir processo;
- consultar linha do tempo.

## Novos Módulos

Novos módulos deverão seguir o mesmo padrão:

```text
modulos/
├── afastamentos/
├── ferias/
├── capacitacoes/
└── avaliacoes/
```

Cada módulo poderá utilizar casos de uso globais, sem duplicá-los.
