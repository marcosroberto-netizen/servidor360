# Decisões arquiteturais

Este documento registra decisões que afetam manutenção e evolução. Regras triviais permanecem no código ou nas migrations.

## Frontend por features

**Decisão:** organizar o frontend por domínio em `src/features`.

**Motivo:** separar auth, afastamentos e futuros módulos sem duplicar serviços, hooks ou componentes compartilhados.

**Consequência:** páginas de domínio ficam na feature, e cada feature expõe somente sua API pública por `index.ts`.

## Supabase como backend

**Decisão:** usar Supabase Auth, PostgreSQL, RPCs, RLS e Storage como backend da aplicação.

**Motivo:** o projeto centraliza autenticação, persistência, autorização e documentos em um serviço integrado.

**Consequência:** mutações sensíveis precisam de RPC ou policy no banco. O frontend não é fonte de verdade para autorização.

## Schemas por domínio

**Decisão:** manter `app_auth`, `organizacional`, `servidores`, `medicos` e `afastamentos` como schemas proprietários, deixando `public` para fachadas e helpers.

**Motivo:** evitar tabelas de negócio sem dono claro e reduzir acoplamento entre módulos.

**Consequência:** migrations, grants, RLS e consultas precisam qualificar o schema correto.

## Assinatura eletrônica interna

**Decisão:** o MVP usa assinatura interna com sessão, confirmação de senha, hash, protocolo e evidências técnicas.

**Motivo:** atender o fluxo do projeto sem depender de certificado ou serviço externo.

**Consequência:** a funcionalidade não deve ser descrita como certificado ICP-Brasil. Uma integração externa exige decisão e requisitos próprios.
