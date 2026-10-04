# Desenvolvimento local

Este guia cobre os requisitos, a configuração do frontend, os comandos existentes e a validação mínima antes de abrir uma mudança.

## Requisitos

- Node.js 20 ou superior
- pnpm 10.28.1
- Projeto Supabase remoto vinculado para usar as migrations do ambiente compartilhado
- Docker apenas se você optar por executar a stack Supabase local

## Configurar o frontend

```bash
pnpm install
cp .env.example .env.local
```

Defina estas variáveis em `.env.local`:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sim | URL pública do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública para o cliente Supabase |
| `VITE_APP_ENV` | Não | `development`, `staging` ou `production`; padrão `development` |
| `VITE_SENTRY_DSN` | Não | DSN opcional de monitoramento |

Não coloque `service_role` ou outro segredo em variáveis `VITE_*`. O cliente usa sessão persistida em `localStorage` e renovação automática do token.

## Executar e validar

```bash
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

## Testes E2E no navegador

O projeto usa Playwright para testes funcionais E2E no navegador. Na primeira execução da máquina, instale o Chromium usado pelo Playwright:

```bash
pnpm test:e2e:install
```

Para validar o login das contas documentadas em modo automatizado:

```bash
pnpm test:e2e:login
```

Para acompanhar o teste ao vivo, com a janela do navegador visível:

```bash
pnpm test:e2e:login:headed
```

Para abrir a interface interativa do Playwright, útil durante investigação no VS Code:

```bash
pnpm test:e2e:ui
```

Os testes sobem o Vite automaticamente em `http://127.0.0.1:5173`. A senha padrão usada no teste de login é a senha documentada em `docs/usuarios-teste.md`; se necessário, sobrescreva com `E2E_TEST_PASSWORD`.

Além dos testes automatizados, valide manualmente recuperação de senha, escopo por unidade, criação de afastamento, documento, assinatura, devolutiva e validação por protocolo quando essas áreas forem alteradas.

## Alterar o banco

Use migrations imperativas na raiz do repositório:

```bash
supabase migration new nome_descritivo
supabase migration list
supabase db push --linked --dry-run
supabase db push --linked --yes
supabase migration list
```

Antes de aplicar, revise apenas a migration criada e confirme a prévia. Para mudanças em RLS, funções, grants, views ou Storage, execute o advisor de segurança disponível na CLI:

```bash
supabase db advisors --linked --type security
```

Consulte [Banco de dados](database.md) para o modelo e [Deploy](deployment.md) para a ordem de publicação. Não use `supabase db reset` no projeto remoto.

## Organização do código

- Coloque código de domínio em `src/features/<modulo>`
- Mantenha chamadas Supabase em `services`
- Mantenha hooks de consulta e mutation em `hooks`
- Exponha a API da feature em `index.ts`
- Use `src/shared` para componentes realmente reutilizáveis
- Atualize a documentação quando uma rota, permissão, migration, RPC, policy, bucket ou comando mudar
