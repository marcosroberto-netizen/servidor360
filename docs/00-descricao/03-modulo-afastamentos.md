# Servidor 360 — Módulo de Afastamentos

## 1. Objetivo do Módulo

O **Módulo de Afastamentos** será o primeiro processo completo implementado dentro do Servidor 360.

Seu objetivo é controlar o ciclo de vida dos documentos relacionados a afastamentos, desde o recebimento pela unidade de origem até a análise pelo setor responsável, emissão da devolutiva e realização das providências administrativas.

Cada afastamento deverá gerar um processo digital rastreável e vinculado ao prontuário do servidor.

## 2. Participantes Principais

### Unidade Escolar / Diretor
Poderá:
- localizar servidores vinculados à sua unidade;
- registrar o afastamento;
- anexar o documento recebido;
- acompanhar a situação;
- atender solicitações de complementação;
- visualizar a devolutiva destinada à unidade.

Não terá acesso automático ao prontuário médico/ocupacional completo.

### Educação
Poderá acompanhar os afastamentos dos servidores vinculados à Secretaria de Educação, conforme suas permissões.

### CAS
Poderá:
- visualizar processos pendentes;
- acessar as informações necessárias para análise;
- registrar movimentações;
- solicitar complementação;
- encaminhar para avaliação;
- acompanhar a conclusão da análise.

### Médico / Profissional Autorizado
Responsável pela avaliação e produção da devolutiva formal.

### RH
Responsável pelas providências administrativas decorrentes da análise.

## 3. Início do Processo

O processo começa quando o diretor ou outro usuário autorizado recebe um documento relacionado ao afastamento de um servidor.

Fluxo inicial:
1. localizar o servidor;
2. iniciar um novo afastamento;
3. registrar as informações necessárias;
4. anexar o documento;
5. revisar os dados;
6. enviar o processo.

Após o envio, o sistema deverá gerar um protocolo e vincular o processo ao prontuário funcional do servidor.

## 3.1 Cofre Digital e Assinatura

Durante a tramitação, documentos formais poderão ser gerados dentro do próprio Servidor 360, como resumo do processo, devolutiva formal ou providência administrativa.

Esses documentos deverão ficar salvos no cofre digital do processo e poderão receber assinatura eletrônica interna.

Fluxo da assinatura:
1. gerar documento digital;
2. congelar a versão do conteúdo;
3. calcular hash SHA-256;
4. solicitar confirmação de senha do usuário;
5. registrar assinatura eletrônica;
6. gerar protocolo e QR Code de validação;
7. disponibilizar o documento aos interessados autorizados.

A assinatura interna não exige download, upload, certificado digital ou integração externa para o MVP.

## 4. Tramitação

Exemplo de estados:

**Registrado → Encaminhado → Aguardando Análise → Em Análise → Aguardando Complementação → Avaliado → Aguardando RH → Concluído**

Nem todos os processos precisarão passar por todos os estados.

## 5. Análise pelo CAS

O CAS deverá possuir uma fila própria de trabalho.

O profissional responsável poderá:
- abrir o processo;
- consultar o documento;
- analisar as informações;
- solicitar complementação;
- encaminhar para avaliação;
- registrar observações permitidas;
- prosseguir para emissão da devolutiva.

## 6. Devolutiva Formal

A análise não deverá ser concluída apenas como "deferido" ou "indeferido".

O profissional responsável deverá produzir uma **devolutiva formal**, que poderá conter:
- apto;
- inapto;
- apto com restrições;
- necessidade de nova avaliação;
- necessidade de complementação;
- outra conclusão prevista.

A devolutiva deverá registrar:
- responsável;
- data e hora;
- resultado;
- descrição;
- orientações;
- vínculo com o processo.

## 7. Visualização da Devolutiva

A devolutiva deverá respeitar o controle de acesso.

A unidade escolar poderá receber a informação necessária para continuidade do processo sem acessar o prontuário médico completo.

O RH deverá receber somente o necessário para executar a providência administrativa.

## 8. Continuidade pelo RH

Após a análise, o processo poderá seguir para o RH.

O RH deverá registrar a providência realizada, por exemplo:
- lançamento;
- registro do afastamento;
- atualização de frequência;
- outra providência administrativa;
- confirmação de conclusão.

O processo não deverá ser considerado concluído enquanto houver etapa administrativa pendente.

## 9. Complementação ou Correção

Caso exista pendência:
1. a pendência será registrada;
2. o responsável será notificado;
3. o processo continuará aberto;
4. o novo documento será anexado ao mesmo processo;
5. todo o histórico anterior será preservado.

## 10. Histórico do Afastamento

Cada afastamento deverá possuir linha do tempo própria, registrando eventos como:

> Documento registrado  
> Processo encaminhado ao CAS  
> Análise iniciada  
> Complementação solicitada  
> Novo documento enviado  
> Devolutiva emitida  
> Processo encaminhado ao RH  
> Providência administrativa registrada  
> Processo concluído

## 11. Relação com o Prontuário do Servidor

O afastamento deverá estar sempre vinculado ao prontuário funcional do servidor.

O prontuário poderá apresentar:
- data do afastamento;
- período;
- situação;
- documentos;
- devolutiva;
- histórico;
- providências administrativas.

Informações médicas restritas deverão permanecer protegidas.

## 12. Página Inicial por Perfil

### Diretor
- novos afastamentos;
- processos em andamento;
- solicitações de complementação;
- devolutivas disponíveis.

### CAS
- aguardando análise;
- em análise;
- aguardando complementação;
- avaliações concluídas.

### Médico
- avaliações pendentes;
- processos em atendimento;
- devolutivas a concluir.

### RH
- aguardando providência;
- processos concluídos;
- pendências administrativas.

## 13. Rastreabilidade

O sistema deverá registrar as principais ações:
- criação;
- envio;
- recebimento;
- análise;
- solicitação de complementação;
- inclusão de novo documento;
- emissão de devolutiva;
- encaminhamento;
- providência do RH;
- conclusão.

## 14. Resultado Esperado

Ao final do processo, o Servidor 360 deverá possuir um registro completo do afastamento, contendo:
- documento de origem;
- documentos digitais assinados;
- protocolo;
- movimentações;
- análise;
- devolutiva;
- documentos complementares;
- providências administrativas;
- histórico;
- situação final.

## 15. Limite do Primeiro MVP

Para a primeira versão, priorizar:
- registro do afastamento;
- envio de documento;
- tramitação;
- fila do CAS;
- análise;
- solicitação de complementação;
- devolutiva formal;
- encaminhamento ao RH;
- conclusão administrativa;
- histórico;
- controle de acesso.
- assinatura eletrônica interna de documentos digitais.
