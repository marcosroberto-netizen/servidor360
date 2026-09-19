# Build e deploy

O repositório está configurado para publicar o frontend Vite na Vercel. O arquivo `vercel.json` define o comando de build, a pasta de saída, o fallback do SPA e headers de segurança.

## Build de produção

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

O build executa `tsc -b` e depois `vite build`, gerando `dist/`. O preview local usa:

```bash
pnpm preview
```

## Vercel

`vercel.json` define:

- framework `vite`
- build command `pnpm build`
- output directory `dist`
- rewrite para a entrada do SPA
- cache de assets e headers de segurança

Configure no ambiente da Vercel as mesmas variáveis públicas exigidas pelo frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e, quando necessário, `VITE_APP_ENV` e `VITE_SENTRY_DSN`.

O repositório não contém configuração de outro provedor de deploy nem um script de publicação próprio. O ato de iniciar o deploy depende da integração da Vercel com o repositório e não está automatizado em `package.json`.

## Banco antes da publicação

1. Revise migrations novas e o impacto em RLS, RPCs, grants e Storage.
2. Confira o histórico remoto com `supabase migration list`.
3. Rode `supabase db push --linked --dry-run`.
4. Aplique somente as migrations esperadas com `supabase db push --linked --yes`.
5. Confirme o histórico e execute advisors quando a mudança for sensível.
6. Rode `pnpm lint` e `pnpm build`.

O frontend não aplica migrations durante o build. A atualização do banco é uma etapa separada e explícita.
