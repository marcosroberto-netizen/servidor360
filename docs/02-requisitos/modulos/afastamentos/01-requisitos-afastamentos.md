# Servidor 360 — Requisitos do Módulo de Afastamentos

## 1. Objetivo

Este documento define os requisitos específicos do **Módulo de Afastamentos**.

O módulo utilizará os recursos globais do Servidor 360, como autenticação, usuários, permissões, servidores, prontuário, documentos, histórico e rastreabilidade.

---

# 2. Responsabilidades do Módulo

O módulo será responsável por:

- iniciar afastamentos;
- receber documentos relacionados;
- controlar tramitação;
- disponibilizar filas de trabalho;
- permitir análise pelo CAS;
- permitir complementação;
- encaminhar para avaliação;
- registrar devolutivas;
- gerar documentos digitais assináveis;
- coletar assinatura eletrônica interna;
- encaminhar para providências administrativas;
- concluir o processo.

---

# 3. Perfis Envolvidos

## Diretor / Unidade Escolar
Registra afastamentos, acompanha processos, responde pendências e consulta devolutivas permitidas.

## Educação
Acompanha processos conforme suas atribuições e permissões.

## CAS
Realiza triagem, análise e encaminhamentos relacionados ao processo ocupacional.

## Médico / Profissional Autorizado
Realiza avaliação e emite devolutiva formal.

## RH
Realiza providências administrativas e finaliza sua etapa do processo.

---

# 4. Requisitos Funcionais

## RF-A01 — Iniciar Afastamento
O sistema deverá permitir que usuário autorizado inicie um novo afastamento.

## RF-A02 — Selecionar Servidor
O afastamento deverá ser vinculado a um servidor previamente identificado no núcleo global.

## RF-A03 — Registrar Dados do Afastamento
O sistema deverá permitir registrar as informações necessárias ao processo.

## RF-A04 — Anexar Documento
O sistema deverá permitir anexar o documento de origem do afastamento.

## RF-A05 — Validar Escopo da Unidade
O sistema deverá impedir o registro por usuário sem responsabilidade sobre o servidor, salvo permissão específica.

## RF-A06 — Gerar Protocolo
O sistema deverá gerar um identificador único para o processo.

## RF-A07 — Vincular ao Prontuário
O processo deverá ser vinculado automaticamente ao prontuário funcional.

## RF-A08 — Encaminhar Processo
O sistema deverá encaminhar o processo conforme a etapa definida.

## RF-A09 — Fila do CAS
O CAS deverá visualizar processos que aguardam sua atuação.

## RF-A10 — Consultar Processo
Usuários autorizados deverão consultar o processo de acordo com seu nível de acesso.

## RF-A11 — Registrar Análise
O CAS deverá poder registrar a análise realizada.

## RF-A12 — Solicitar Complementação
O CAS deverá poder solicitar correção ou documentação complementar.

## RF-A13 — Responder Complementação
O responsável deverá poder responder à pendência dentro do mesmo processo.

## RF-A14 — Preservar Histórico
O módulo deverá preservar documentos e movimentações anteriores.

## RF-A15 — Encaminhar para Avaliação
O CAS deverá poder encaminhar o processo para profissional autorizado.

## RF-A16 — Emitir Devolutiva
Profissional autorizado deverá poder emitir devolutiva formal.

## RF-A17 — Registrar Resultado
A devolutiva deverá permitir resultados como:
- apto;
- inapto;
- apto com restrições;
- necessidade de nova avaliação;
- necessidade de complementação;
- outra conclusão prevista.

## RF-A18 — Registrar Descrição e Orientações
A devolutiva deverá permitir descrição e orientações relacionadas à avaliação.

## RF-A19 — Identificar Responsável
O sistema deverá registrar profissional, data e hora da devolutiva.

## RF-A20 — Controlar Visualização da Devolutiva
A devolutiva deverá ser apresentada conforme as permissões de cada perfil.

## RF-A21 — Encaminhar ao RH
O sistema deverá encaminhar ao RH os processos que exigirem providência administrativa.

## RF-A22 — Fila do RH
O RH deverá visualizar processos que aguardam sua atuação.

## RF-A23 — Registrar Providência Administrativa
O RH deverá poder registrar a providência realizada.

## RF-A24 — Concluir Processo
O módulo deverá permitir conclusão somente quando as etapas obrigatórias estiverem finalizadas.

## RF-A25 — Acompanhar Situação
Usuários autorizados deverão poder acompanhar o estado atual do processo.

## RF-A26 — Linha do Tempo do Afastamento
O módulo deverá apresentar a sequência cronológica das movimentações.

## RF-A27 — Pendências por Perfil
O módulo deverá fornecer ao núcleo global as pendências associadas a cada usuário.

## RF-A28 — Gerar Documento Digital
O módulo deverá permitir gerar documentos digitais a partir dos dados do processo de afastamento, como resumo do processo e devolutiva formal.

## RF-A29 — Assinar Documento Digital
Usuário autorizado deverá poder assinar eletronicamente um documento digital mediante sessão autenticada e confirmação de senha.

## RF-A30 — Validar Documento Digital
O módulo deverá permitir validar documento digital por protocolo ou QR Code, exibindo status, hash, assinante e vínculo com o processo.

---

# 5. Estados Iniciais do Processo

O processo poderá utilizar estados como:

- Registrado;
- Encaminhado;
- Aguardando Análise;
- Em Análise;
- Aguardando Complementação;
- Aguardando Avaliação;
- Avaliado;
- Aguardando RH;
- Concluído.

Os estados definitivos poderão ser refinados durante a modelagem.

---

# 6. Regras de Negócio do Módulo

## RN-A01 — Servidor Obrigatório
Todo afastamento deverá estar vinculado a um servidor.

## RN-A02 — Documento de Origem
O documento de origem deverá ser obrigatório quando exigido pelo processo.

## RN-A03 — Protocolo Único
Cada processo deverá possuir protocolo único.

## RN-A04 — Diretor Restrito à Unidade
O diretor deverá registrar afastamentos apenas para servidores sob sua responsabilidade.

## RN-A05 — Complementação no Mesmo Processo
Correções e documentos complementares deverão permanecer vinculados ao processo original.

## RN-A06 — Histórico Preservado
A complementação não deverá apagar documentos ou movimentações anteriores.

## RN-A07 — Devolutiva Formal
Quando houver avaliação profissional, deverá existir uma devolutiva formal.

## RN-A08 — Devolutiva com Responsável
A devolutiva deverá identificar profissional responsável, data e hora.

## RN-A09 — Visualização Controlada
Receber uma devolutiva não deverá conceder acesso ao prontuário médico completo.

## RN-A10 — RH com Informação Necessária
O RH deverá visualizar apenas as informações necessárias à providência administrativa.

## RN-A11 — Conclusão Condicionada
O processo somente poderá ser concluído sem etapas obrigatórias pendentes.

## RN-A12 — Rastreabilidade
Mudanças de etapa e principais ações deverão ser registradas.

## RN-A13 — Documento Assinado Imutável
Após assinatura, o documento digital deverá permanecer imutável. Alterações deverão gerar novo documento ou versão complementar.

## RN-A14 — Assinatura Vinculada ao Processo
A assinatura deverá permanecer vinculada ao documento, ao processo, ao servidor e ao usuário assinante.

---

# 7. Critérios de Aceite

O módulo será considerado aderente ao MVP quando:

1. diretor puder registrar afastamento para servidor autorizado;
2. documento puder ser anexado;
3. protocolo for gerado;
4. processo chegar à fila do CAS;
5. CAS puder analisar e solicitar complementação;
6. responsável puder complementar o mesmo processo;
7. profissional autorizado puder emitir devolutiva;
8. devolutiva respeitar níveis de acesso;
9. processo puder ser encaminhado ao RH;
10. RH puder registrar providência;
11. processo puder ser concluído;
12. documentos digitais puderem ser gerados e assinados;
13. documentos assinados puderem ser validados por protocolo ou QR Code;
14. todo o fluxo permanecer rastreável.
