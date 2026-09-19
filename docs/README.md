# Documentação do Servidor 360

Esta pasta contém a referência de manutenção do sistema. Cada documento tem um assunto próprio; confirme detalhes de implementação no código e nas migrations quando uma mudança puder alterar o comportamento descrito.

## Referência canônica

- [Arquitetura](architecture.md)
- [Banco de dados](database.md)
- [Triagem CAS de afastamentos](cas-triagem-afastamentos.md)
- [Desenvolvimento](development.md)
- [Deploy](deployment.md)
- [Fluxos e status](flows.md)
- [Decisões arquiteturais](decisions.md)

## Material auxiliar

- [Usuários de teste](usuarios-teste.md)
- [Apresentações](apresentacoes/)
- [Entregas acadêmicas](entregas/)

Apresentações, entregas e contas de teste apoiam validação ou demonstração. Eles não substituem os documentos canônicos.

## Atualizar a documentação

Atualize o documento correspondente quando mudar uma rota, permissão, fluxo, migration, RPC, policy, bucket, variável de ambiente ou comando de execução. Remova uma afirmação planejada quando ela deixar de refletir o produto, ou marque-a como backlog em [Fluxos e status](flows.md).

Quando dois documentos parecerem discordar, considere esta ordem de autoridade:

1. migrations e configuração do Supabase;
2. código de rotas, services e hooks;
3. documentação canônica;
4. materiais auxiliares.
