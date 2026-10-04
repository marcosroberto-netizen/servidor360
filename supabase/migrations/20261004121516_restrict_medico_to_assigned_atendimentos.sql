-- Keep only the capabilities required by the medical attendance workflow.
delete from app_auth.perfil_permissoes pp
using app_auth.perfis p, app_auth.permissoes pe
where pp.perfil_id = p.id
  and pp.permissao_id = pe.id
  and p.nome = 'medico'
  and (pe.recurso || ':' || pe.acao) not in (
    'portal:read',
    'afastamentos:avaliar',
    'afastamentos:emitir_devolutiva',
    'afastamentos:ler_devolutiva',
    'afastamentos:visualizar_documento',
    'afastamentos:gerar_documento',
    'afastamentos:assinar_documento'
  );

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
cross join app_auth.permissoes pe
where p.nome = 'medico'
  and (pe.recurso || ':' || pe.acao) in (
    'portal:read',
    'afastamentos:avaliar',
    'afastamentos:emitir_devolutiva',
    'afastamentos:ler_devolutiva',
    'afastamentos:visualizar_documento',
    'afastamentos:gerar_documento',
    'afastamentos:assinar_documento'
  )
on conflict (perfil_id, permissao_id) do nothing;

create or replace function public.current_user_has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = app_auth, public, auth
as $$
  with current_authz as (
    select app_auth.user_authz_payload((select auth.uid())) as payload
  )
  select (select auth.uid()) is not null
    and (
      not (payload -> 'perfis' ? 'medico')
      or payload -> 'perfis' ? 'administrador'
      or permission_name in (
        'portal:read',
        'afastamentos:avaliar',
        'afastamentos:emitir_devolutiva',
        'afastamentos:ler_devolutiva',
        'afastamentos:visualizar_documento',
        'afastamentos:gerar_documento',
        'afastamentos:assinar_documento'
      )
    )
    and exists (
      select 1
      from jsonb_array_elements_text(payload -> 'permissoes') as permissions(value)
      where permissions.value in ('*', permission_name)
    )
  from current_authz;
$$;

create or replace function public.current_user_can_access_afastamento(afastamento_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = afastamentos, servidores, public, auth
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from afastamentos.afastamentos a
      where a.id = afastamento_uuid
        and (
          public.current_user_has_permission('afastamentos:read')
          or (
            public.current_user_has_permission('afastamentos:avaliar')
            and exists (
              select 1
              from afastamentos.avaliacoes_medicas am
              join afastamentos.avaliadores av on av.id = am.avaliador_id
              where am.afastamento_id = a.id
                and am.status in ('pendente', 'concluida')
                and av.usuario_id = (select auth.uid())
            )
          )
          or (
            public.current_user_has_permission('afastamentos:create')
            and exists (
              select 1
              from servidores.lotacoes_funcionais lf
              where lf.vinculo_funcional_id = a.vinculo_funcional_id
                and lf.ativo
                and public.current_user_has_unidade(lf.unidade_id)
            )
          )
        )
    );
$$;

revoke all on function public.current_user_has_permission(text) from public, anon;
grant execute on function public.current_user_has_permission(text) to authenticated;
revoke all on function public.current_user_can_access_afastamento(uuid) from public, anon;
grant execute on function public.current_user_can_access_afastamento(uuid) to authenticated;
