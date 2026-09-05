# Servidor 360 --- Etapas Essenciais do Projeto

Para otimizar o tempo disponível, a documentação do **Servidor 360**
será concentrada apenas nas etapas essenciais para análise, modelagem e
início do desenvolvimento.

## Estrutura

``` text
Servidor-360/
│
├── docs/
│   ├── 01-VISAO-DO-PRODUTO.md
│   ├── 02-REQUISITOS.md
│   ├── 03-CASOS-DE-USO.md
│   ├── 04-DIAGRAMA-DE-CLASSES.md
│   ├── 05-MODELO-DE-DADOS.md
│   └── 06-ARQUITETURA.md
│
└── README.md
```

## 1. Visão do Produto

**Arquivo:** `01-VISAO-DO-PRODUTO.md`

Descrever de forma objetiva:

-   problema que o Servidor 360 pretende resolver;
-   objetivo do sistema;
-   público-alvo;
-   funcionamento geral do portal;
-   prontuário funcional digital;
-   controle de acesso por perfil;
-   fluxo inicial de atestados, CAS e RH;
-   escopo inicial do produto.

**Resultado:** definição clara do que é o Servidor 360 e qual problema
ele resolve.

------------------------------------------------------------------------

## 2. Requisitos

**Arquivo:** `02-REQUISITOS.md`

Centralizar em um único documento:

-   requisitos funcionais;
-   requisitos não funcionais;
-   regras de negócio;
-   perfis de usuários;
-   permissões de acesso;
-   restrições importantes de segurança e privacidade.

**Resultado:** definição objetiva do que o sistema deverá fazer e das
principais regras que deverão ser respeitadas.

------------------------------------------------------------------------

## 3. Casos de Uso

**Arquivo:** `03-CASOS-DE-USO.md`

Definir os principais atores e suas ações no sistema.

Principais atores:

-   Diretor/Unidade Escolar;
-   Educação;
-   CAS;
-   Médico;
-   RH;
-   Administrador.

Principais ações:

-   autenticar no portal;
-   localizar servidor;
-   consultar informações autorizadas;
-   registrar atestado;
-   acompanhar processo;
-   analisar documentação;
-   solicitar complementação;
-   emitir devolutiva;
-   realizar providência administrativa;
-   consultar histórico.

Incluir o **Diagrama de Casos de Uso UML**.

**Resultado:** visão clara de quem utiliza o sistema e quais operações
cada perfil realiza.

------------------------------------------------------------------------

## 4. Diagrama de Classes

**Arquivo:** `04-DIAGRAMA-DE-CLASSES.md`

Modelar os principais elementos do sistema e seus relacionamentos.

Exemplos iniciais:

-   Usuário;
-   Perfil;
-   Servidor;
-   Unidade;
-   Prontuário;
-   Documento;
-   Atestado;
-   Processo;
-   Parecer/Devolutiva;
-   Movimentação.

Incluir o **Diagrama de Classes UML**.

**Resultado:** representação da estrutura conceitual do software antes
da implementação.

------------------------------------------------------------------------

## 5. Modelo de Dados

**Arquivo:** `05-MODELO-DE-DADOS.md`

Definir como as informações principais serão organizadas e relacionadas.

Incluir:

-   entidades;
-   atributos principais;
-   identificadores;
-   relacionamentos;
-   chaves primárias e estrangeiras;
-   **Diagrama Entidade-Relacionamento (DER)**.

**Resultado:** modelo necessário para criação e organização do banco de
dados.

------------------------------------------------------------------------

## 6. Arquitetura

**Arquivo:** `06-ARQUITETURA.md`

Definir de forma simples a organização técnica do sistema:

``` text
USUÁRIO
   ↓
FRONT-END
   ↓
BACK-END / API
   ↓
BANCO DE DADOS
```

Descrever brevemente:

-   responsabilidade do front-end;
-   responsabilidade do back-end;
-   comunicação entre as camadas;
-   banco de dados;
-   autenticação e autorização;
-   armazenamento de documentos;
-   proteção das informações funcionais e médicas.

**Resultado:** visão técnica necessária para iniciar o desenvolvimento
de forma organizada.

------------------------------------------------------------------------

# Sequência de Execução

A ordem de trabalho será:

**1. Visão do Produto**\
↓\
**2. Requisitos**\
↓\
**3. Casos de Uso + Diagrama**\
↓\
**4. Diagrama de Classes**\
↓\
**5. Modelo de Dados + DER**\
↓\
**6. Arquitetura**\
↓\
**7. Desenvolvimento**

Após essas seis etapas, a prioridade passa a ser a implementação do
software.

Documentações adicionais poderão ser produzidas posteriormente somente
se houver necessidade ou disponibilidade de tempo.

------------------------------------------------------------------------

## Objetivo

A documentação deverá ser **curta, objetiva e suficiente para orientar o
desenvolvimento**.

O foco principal é evitar excesso de documentação e garantir tempo para
construir um MVP funcional do **Servidor 360**, demonstrando:

**Portal + Controle de Acesso + Prontuário Digital + Atestados + CAS +
Devolutiva + RH + Histórico.**
