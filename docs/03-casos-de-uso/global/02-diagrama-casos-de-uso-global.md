# Servidor 360 — Diagrama de Casos de Uso Global

## 1. Objetivo

Este diagrama representa apenas os casos de uso compartilhados pelo **núcleo global do Servidor 360**.

```mermaid
flowchart LR
    Usuario[Usuário Autorizado]
    Admin[Administrador]
    Gestor[Gestor Autorizado]

    subgraph S360[Núcleo Global — Servidor 360]
        UC1((Autenticar))
        UC2((Consultar Servidor))
        UC3((Consultar Prontuário Funcional))
        UC4((Consultar Documentos))
        UC5((Consultar Histórico))
        UC6((Consultar Pendências))
        UC7((Consultar Indicadores))
        UC8((Gerenciar Usuários))
        UC9((Gerenciar Perfis e Permissões))
        UC10((Gerenciar Unidades e Setores))
    end

    Usuario --> UC1
    Usuario --> UC2
    Usuario --> UC3
    Usuario --> UC4
    Usuario --> UC5
    Usuario --> UC6

    Gestor --> UC1
    Gestor --> UC2
    Gestor --> UC3
    Gestor --> UC5
    Gestor --> UC7

    Admin --> UC1
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
```

## 2. Observação Arquitetural

Esses casos de uso representam serviços compartilhados que deverão ser utilizados pelos módulos de negócio.

O módulo de Afastamentos, por exemplo, não deverá implementar sua própria autenticação ou cadastro de servidores. Ele deverá consumir os recursos disponibilizados pelo núcleo global.
