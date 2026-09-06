insert into app_auth.permissoes (nome, recurso, acao)
values (
  'Visualizar documento anexado ao afastamento',
  'afastamentos',
  'visualizar_documento'
)
on conflict (recurso, acao) do update
set nome = excluded.nome;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
join app_auth.permissoes pe
  on pe.recurso = 'afastamentos'
 and pe.acao = 'visualizar_documento'
where p.nome = 'gestor_escolar'
on conflict (perfil_id, permissao_id) do nothing;

drop policy if exists "afastamentos_documentos_select_authenticated" on storage.objects;
drop policy if exists "afastamentos_documentos_select_authorized" on storage.objects;

create policy "afastamentos_documentos_select_authorized"
on storage.objects for select
to authenticated
using (
  bucket_id = 'afastamentos-documentos'
  and public.current_user_has_permission('afastamentos:visualizar_documento')
  and (
    not public.current_user_is_gestor_escolar()
    or (
      split_part(name, '/', 1) = 'origem'
      and split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and exists (
        select 1
        from servidores.servidores s
        where s.id = split_part(name, '/', 2)::uuid
          and public.current_user_has_unidade(s.unidade_id)
      )
    )
    or (
      split_part(name, '/', 1) = 'complementacoes'
      and split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and exists (
        select 1
        from afastamentos.afastamentos a
        join servidores.servidores s on s.id = a.servidor_id
        where a.id = split_part(name, '/', 2)::uuid
          and public.current_user_has_unidade(s.unidade_id)
      )
    )
  )
);

do $$
declare
  target_user_id uuid;
begin
  for target_user_id in
    select distinct up.usuario_id
    from app_auth.usuario_perfis up
    join app_auth.perfis p on p.id = up.perfil_id
    where p.nome = 'gestor_escolar'
  loop
    perform app_auth.sync_user_auth_claims(target_user_id);
  end loop;
end;
$$;
