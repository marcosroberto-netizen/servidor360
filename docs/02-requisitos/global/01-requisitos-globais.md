# Servidor 360 — Requisitos Globais

## 1. Objetivo

Este documento define os requisitos pertencentes ao **núcleo global do Servidor 360**.

Esses requisitos não pertencem a um processo específico. Eles representam capacidades compartilhadas por todos os módulos da plataforma.

---

# 2. Escopo Global

O núcleo do Servidor 360 deverá fornecer os recursos comuns necessários para funcionamento dos módulos de negócio.

Principais responsabilidades:

- autenticação;
- controle de acesso;
- usuários;
- perfis e permissões;
- unidades e setores;
- servidores;
- prontuário funcional;
- documentos;
- assinatura eletrônica interna;
- busca;
- histórico;
- rastreabilidade;
- informações médico/ocupacionais restritas;
- indicadores gerais.

---

# 3. Requisitos Funcionais Globais

## RF-G01 — Autenticação
O sistema deverá permitir que usuários autorizados realizem autenticação no portal.

## RF-G02 — Controle de Acesso
O sistema deverá controlar o acesso a módulos, informações e ações conforme perfil, unidade, setor e permissões do usuário.

## RF-G03 — Página Inicial Personalizada
O sistema deverá apresentar uma página inicial compatível com as permissões do usuário.

## RF-G04 — Gestão de Usuários
O sistema deverá permitir cadastrar, ativar, inativar e manter usuários autorizados.

## RF-G05 — Gestão de Perfis
O sistema deverá permitir cadastrar e manter perfis de acesso.

## RF-G06 — Gestão de Permissões
O sistema deverá permitir associar permissões aos perfis e usuários conforme necessidade.

## RF-G07 — Gestão de Unidades e Setores
O sistema deverá permitir cadastrar e manter unidades e setores utilizados pela plataforma.

## RF-G08 — Vínculo de Usuário
O sistema deverá permitir associar usuários às respectivas unidades, setores e responsabilidades.

## RF-G09 — Cadastro de Servidores
O sistema deverá manter os dados necessários para identificação dos servidores.

## RF-G10 — Busca de Servidores
O sistema deverá permitir localizar servidores, no mínimo, por matrícula e nome.

## RF-G11 — Restrição de Busca
A busca deverá retornar somente servidores compatíveis com o escopo de acesso do usuário.

## RF-G12 — Prontuário Funcional Digital
O sistema deverá manter um prontuário funcional digital para cada servidor.

## RF-G13 — Organização do Prontuário
O prontuário deverá permitir organização de informações e documentos por categorias.

## RF-G14 — Controle de Visualização
O sistema deverá exibir somente as informações do prontuário autorizadas para cada usuário.

## RF-G15 — Área Médico/Ocupacional
O sistema deverá manter informações médico/ocupacionais em área de acesso restrito.

## RF-G16 — Inclusão de Documentos
O sistema deverá permitir a inclusão de documentos por usuários autorizados.

## RF-G17 — Vinculação de Documentos
Documentos deverão estar vinculados ao servidor e, quando aplicável, ao módulo ou processo de origem.

## RF-G18 — Consulta de Documentos
O sistema deverá permitir consultar documentos conforme as permissões do usuário.

## RF-G19 — Histórico
O sistema deverá preservar o histórico das principais ações realizadas.

## RF-G20 — Linha do Tempo
O sistema deverá permitir apresentar acontecimentos funcionais e processuais em ordem cronológica.

## RF-G21 — Rastreabilidade
O sistema deverá permitir identificar autor, data, hora e contexto das principais movimentações.

## RF-G22 — Consulta de Processos por Servidor
O prontuário deverá permitir visualizar processos vinculados ao servidor conforme as permissões do usuário.

## RF-G23 — Pendências
O sistema deverá permitir que módulos apresentem pendências e atividades ao usuário responsável.

## RF-G24 — Indicadores Gerais
O sistema deverá permitir a apresentação de informações consolidadas a usuários autorizados.

## RF-G25 — Assinatura Eletrônica Interna
O sistema deverá permitir que documentos digitais sejam assinados eletronicamente por usuários autenticados e autorizados.

## RF-G26 — Versão Imutável de Documento
O sistema deverá preservar uma versão congelada do conteúdo assinado, impedindo alteração direta após a assinatura.

## RF-G27 — Validação Interna de Documento
O sistema deverá permitir validar documentos digitais por protocolo ou QR Code, respeitando permissões e escopo de acesso.

---

# 4. Regras de Negócio Globais

## RN-G01 — Menor Privilégio
O usuário deverá acessar somente as informações necessárias às suas responsabilidades.

## RN-G02 — Separação de Informações
Informações funcionais, administrativas e médico/ocupacionais deverão possuir níveis de acesso distintos.

## RN-G03 — Prontuário Médico Restrito
O acesso ao prontuário funcional não deverá conceder acesso automático ao prontuário médico/ocupacional.

## RN-G04 — Escopo por Unidade
Usuários vinculados a unidades específicas deverão consultar somente os servidores e informações permitidos dentro de seu escopo.

## RN-G05 — Vinculação ao Servidor
Todo documento ou processo relacionado à vida funcional deverá estar vinculado ao servidor correspondente.

## RN-G06 — Histórico Preservado
Movimentações relevantes não deverão ser removidas do histórico operacional.

## RN-G07 — Rastreabilidade
As principais ações deverão registrar responsável, data e hora.

## RN-G08 — Administração sem Acesso Médico Automático
Possuir perfil administrativo não deverá conceder, por si só, acesso ao conteúdo médico/ocupacional.

## RN-G09 — Indicadores sem Exposição Indevida
Informações gerenciais deverão evitar exposição de dados restritos além do necessário.

## RN-G10 — Modularidade
Regras específicas de processos deverão permanecer em seus respectivos módulos e não no núcleo global.

## RN-G11 — Integridade de Documento Assinado
Todo documento assinado deverá possuir hash criptográfico, protocolo e vínculo com o usuário assinante.

## RN-G12 — Correção por Nova Versão
Documentos assinados não deverão ser editados diretamente. Correções deverão gerar novo documento, versão complementar ou substituição rastreável.

---

# 5. Requisitos Não Funcionais Globais

## RNF-G01 — Segurança
O sistema deverá proteger informações contra acesso não autorizado.

## RNF-G02 — Autorização no Servidor
As permissões deverão ser validadas também no back-end, independentemente da interface exibida.

## RNF-G03 — Confidencialidade
Informações restritas deverão ser acessíveis somente a usuários autorizados.

## RNF-G04 — Integridade
O sistema deverá proteger informações contra alterações indevidas ou perda acidental.

## RNF-G05 — Auditoria
Ações relevantes deverão possuir registros suficientes para auditoria.

## RNF-G06 — Usabilidade
A interface deverá ser simples e orientada às atividades de cada perfil.

## RNF-G07 — Responsividade
O portal deverá possuir interface adaptável aos tamanhos de tela definidos para o projeto.

## RNF-G08 — Desempenho
Consultas operacionais deverão apresentar tempo de resposta adequado ao uso normal.

## RNF-G09 — Manutenibilidade
O sistema deverá permitir evolução sem exigir alterações desnecessárias em módulos independentes.

## RNF-G10 — Modularidade
Novos módulos deverão poder utilizar os recursos globais sem duplicar suas responsabilidades.

## RNF-G11 — Privacidade
O tratamento de dados deverá considerar finalidade, necessidade e sensibilidade das informações.

## RNF-G12 — Evidência de Autoria
Assinaturas eletrônicas internas deverão registrar usuário, perfil, data, hora e evidências técnicas disponíveis.

---

# 6. Critérios Gerais de Aceite

O núcleo global será considerado aderente quando:

1. o usuário puder autenticar-se;
2. o sistema respeitar perfis e permissões;
3. usuários visualizarem somente os recursos permitidos;
4. servidores puderem ser cadastrados e localizados;
5. cada servidor possuir prontuário funcional;
6. documentos puderem ser vinculados ao prontuário;
7. informações médico/ocupacionais permanecerem protegidas;
8. ações relevantes forem rastreáveis;
9. documentos digitais puderem ser assinados e validados internamente;
10. módulos puderem utilizar os serviços globais sem duplicação de responsabilidades.
