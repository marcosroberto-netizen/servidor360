begin;

do $$
declare
  physician record;
  tested_users integer := 0;
begin
  for physician in
    select u.id
    from app_auth.usuarios u
    where u.ativo
      and app_auth.user_authz_payload(u.id) -> 'perfis' ? 'medico'
      and not (app_auth.user_authz_payload(u.id) -> 'perfis' ? 'administrador')
  loop
    tested_users := tested_users + 1;
    perform set_config('request.jwt.claim.sub', physician.id::text, true);

    if not public.current_user_has_permission('afastamentos:avaliar')
      or not public.current_user_has_permission('afastamentos:assinar_documento') then
      raise exception 'Medico sem as permissoes necessarias ao atendimento';
    end if;

    if exists (
      select 1
      from app_auth.permissoes pe
      where public.current_user_has_permission(pe.recurso || ':' || pe.acao)
        and (pe.recurso || ':' || pe.acao) not in (
          'portal:read', 'afastamentos:avaliar', 'afastamentos:emitir_devolutiva',
          'afastamentos:ler_devolutiva', 'afastamentos:visualizar_documento',
          'afastamentos:gerar_documento', 'afastamentos:assinar_documento'
        )
    ) then
      raise exception 'Medico tem permissao fora do atendimento';
    end if;

    if exists (
      select 1
      from afastamentos.afastamentos a
      where public.current_user_can_access_afastamento(a.id) is distinct from exists (
        select 1
        from afastamentos.avaliacoes_medicas am
        join afastamentos.avaliadores av on av.id = am.avaliador_id
        where am.afastamento_id = a.id
          and am.status in ('pendente', 'concluida')
          and av.usuario_id = physician.id
      )
    ) then
      raise exception 'Escopo medico diverge das atribuicoes pendentes e concluidas';
    end if;

    if exists (
      select 1
      from public.list_minhas_avaliacoes_afastamento() queue
      where not exists (
        select 1
        from afastamentos.avaliacoes_medicas am
        join afastamentos.avaliadores av on av.id = am.avaliador_id
        where am.afastamento_id = queue.id
          and av.usuario_id = physician.id
          and am.status = 'pendente'
          and queue.status = 'aguardando_avaliacao'
      )
    ) then
      raise exception 'Fila medica contem processo fora da atribuicao';
    end if;
  end loop;

  if tested_users = 0 then
    raise exception 'Nenhum usuario medico ativo para verificar';
  end if;
end;
$$;

select 'Permissoes, escopo e fila dos medicos verificados' as resultado;
rollback;
