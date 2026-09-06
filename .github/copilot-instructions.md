# Regras arquiteturais do Servidor 360

Antes de alterar qualquer código, consulte `docs/04-arquitetura/03-arquitetura.md` e preserve suas camadas e fronteiras.

## Regras obrigatórias

- `src/pages/` contém apenas composição e adaptação de rotas; a implementação de cada tela pertence à feature correspondente.
- Dentro de uma feature, `pages/` compõe a tela e `components/` implementa suas partes visuais; hooks React ficam em `hooks/` e acesso a dados fica em `services/`.
- Cada feature expõe somente sua API pública por `index.ts`. Consumidores externos não importam arquivos internos de outra feature.
- Componentes, hooks, tipos, utilitários e serviços ficam em suas pastas da feature conforme a arquitetura documentada.
- Chamadas ao Supabase e regras de negócio ficam em `features/*/services`; componentes não acessam o Supabase diretamente.
- Dados de servidor usam TanStack Query. Estado local de interface fica no componente ou em Zustand quando for compartilhado; não duplicar dados do servidor em estado local.
- Componentes reutilizáveis ficam em `src/shared`; não duplicar UI compartilhada dentro de features.
- Antes de criar uma nova abstração, procure uma implementação existente na camada correta e mantenha a mudança no menor módulo responsável.
- Toda mudança deve validar a fronteira arquitetural afetada com `pnpm build` e `pnpm lint`, além dos testes disponíveis.