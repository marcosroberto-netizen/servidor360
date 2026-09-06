# Servidor 360 — Assinatura Eletrônica Interna

## 1. Objetivo

A assinatura eletrônica interna permite que documentos digitais do Servidor 360 sejam assinados dentro do próprio sistema, sem impressão, download, reenvio manual ou integração externa obrigatória.

A funcionalidade atende ao cenário acadêmico e ao MVP do projeto, mantendo praticidade para o usuário e preservando evidências de autoria, integridade e rastreabilidade.

## 2. Conceito

O Servidor 360 passa a possuir um **Cofre Digital de Documentos**, onde cada documento gerado pelo sistema pode ter uma versão congelada e assinável.

Após a assinatura:
- o conteúdo assinado não deve ser editado;
- a assinatura fica vinculada ao usuário autenticado;
- o documento recebe protocolo próprio;
- o hash SHA-256 registra a integridade da versão;
- o QR Code direciona para a validação interna;
- todos os interessados autorizados podem consultar o documento dentro do sistema.

## 3. Fluxo Principal

1. Usuário autorizado acessa um processo.
2. O sistema gera um documento digital a partir dos dados do processo.
3. O conteúdo é congelado em uma versão assinável.
4. O sistema calcula o hash SHA-256 do conteúdo.
5. O usuário clica em assinar.
6. O usuário confirma sua senha.
7. O sistema registra a assinatura eletrônica.
8. O documento passa para o status assinado.
9. O QR Code e o protocolo ficam disponíveis para validação interna.

## 4. Evidências Registradas

Cada assinatura deve preservar:
- identificador do documento;
- protocolo do documento;
- hash SHA-256;
- usuário assinante;
- nome e e-mail do assinante;
- perfil utilizado;
- data e hora da assinatura;
- IP, quando disponível;
- navegador/dispositivo;
- processo e servidor vinculados.

## 5. Regras de Negócio

- Um documento assinado não pode ter seu conteúdo alterado.
- Correções devem gerar novo documento ou versão complementar.
- A assinatura exige sessão autenticada e confirmação de senha.
- A visualização respeita as permissões e o escopo do processo.
- A validação por QR Code não substitui o controle de acesso.
- A assinatura interna não é apresentada como certificado ICP-Brasil.
- A arquitetura deve permitir integração futura com GOV.BR ou ICP-Brasil.

## 6. Status do Documento Digital

- `rascunho`: documento ainda em composição;
- `aguardando_assinatura`: versão congelada pronta para assinatura;
- `assinado`: assinatura eletrônica registrada;
- `substituido`: documento mantido no histórico, mas substituído por nova versão;
- `cancelado`: documento invalidado administrativamente.

## 7. Validação Interna

A validação interna permite conferir se um documento existe, está assinado e mantém o mesmo hash registrado no momento da geração.

O QR Code aponta para uma página do Servidor 360 que exibe:
- protocolo;
- status;
- título;
- processo relacionado;
- servidor relacionado;
- hash SHA-256;
- assinantes;
- data e hora da assinatura.

## 8. Justificativa da Escolha

Essa abordagem é a mais adequada para o projeto porque:
- não gera custo;
- não exige certificado digital;
- não depende de API externa;
- evita trabalho manual para o usuário;
- demonstra segurança e rastreabilidade;
- combina com autenticação, permissões, documentos e histórico já previstos no Servidor 360.

## 9. Evolução Futura

Em uma implantação real, a mesma estrutura poderá receber:
- assinatura GOV.BR;
- certificado ICP-Brasil;
- múltiplas assinaturas por documento;
- carimbo do tempo;
- exportação de PDF assinado;
- validação pública por protocolo, quando permitido pela política institucional.
