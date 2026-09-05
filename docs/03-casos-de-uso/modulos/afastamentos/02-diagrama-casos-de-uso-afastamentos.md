# Servidor 360 — Diagrama de Casos de Uso do Módulo de Afastamentos

## 1. Diagrama Principal

```mermaid
flowchart LR
    Diretor[Diretor / Unidade Escolar]
    Educacao[Educação]
    CAS[CAS]
    Medico[Médico / Profissional Autorizado]
    RH[RH]

    subgraph AF[Módulo de Afastamentos]
        A1((Registrar Afastamento))
        A2((Acompanhar Afastamento))
        A3((Responder Complementação))
        A4((Analisar Processo))
        A5((Solicitar Complementação))
        A6((Encaminhar para Avaliação))
        A7((Emitir Devolutiva Formal))
        A8((Consultar Devolutiva))
        A9((Registrar Providência Administrativa))
        A10((Concluir Processo))
        A11((Consultar Linha do Tempo))
    end

    Diretor --> A1
    Diretor --> A2
    Diretor --> A3
    Diretor --> A8
    Diretor --> A11

    Educacao --> A2
    Educacao --> A8
    Educacao --> A11

    CAS --> A2
    CAS --> A4
    CAS --> A5
    CAS --> A6
    CAS --> A8
    CAS --> A11

    Medico --> A7
    Medico --> A8
    Medico --> A11

    RH --> A2
    RH --> A8
    RH --> A9
    RH --> A10
    RH --> A11
```

---

## 2. Dependências com o Núcleo Global

O módulo reutiliza funcionalidades globais do Servidor 360.

```mermaid
flowchart LR
    AF[Módulo de Afastamentos]

    G1((Autenticar))
    G2((Consultar Servidor))
    G3((Consultar Prontuário))
    G4((Consultar Documentos))
    G5((Registrar Histórico))
    G6((Validar Permissão))

    AF -. utiliza .-> G1
    AF -. utiliza .-> G2
    AF -. utiliza .-> G3
    AF -. utiliza .-> G4
    AF -. utiliza .-> G5
    AF -. utiliza .-> G6
```

## 3. Fluxo Principal

```mermaid
flowchart LR
    A[Diretor registra afastamento]
    B[Sistema gera protocolo]
    C[CAS recebe]
    D{Documentação adequada?}
    E[Solicitar complementação]
    F[Responsável complementa]
    G[Avaliação]
    H[Devolutiva formal]
    I[RH recebe]
    J[Providência administrativa]
    K[Processo concluído]

    A --> B --> C --> D
    D -- Não --> E --> F --> C
    D -- Sim --> G --> H --> I --> J --> K
```
