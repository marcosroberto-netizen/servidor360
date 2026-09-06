insert into app_auth.permissoes (nome, recurso, acao)
values (
  'Visualizar documento anexado ao afastamento',
  'afastamentos',
  'visualizar_documento'
)
on conflict (recurso, acao) do update
set nome = excluded.nome;

with role_permissions(role_name, recurso, acao) as (
  values
    ('cas', 'afastamentos', 'visualizar_documento'),
    ('medico', 'afastamentos', 'visualizar_documento'),
    ('enfermeiro', 'afastamentos', 'visualizar_documento')
)
insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from role_permissions rp
join app_auth.perfis p on p.nome = rp.role_name
join app_auth.permissoes pe on pe.recurso = rp.recurso and pe.acao = rp.acao
on conflict (perfil_id, permissao_id) do nothing;

delete from app_auth.perfil_permissoes pp
using app_auth.perfis p, app_auth.permissoes pe
where pp.perfil_id = p.id
  and pp.permissao_id = pe.id
  and pe.recurso = 'afastamentos'
  and pe.acao = 'visualizar_documento'
  and p.nome in ('gestor_escolar', 'educacao', 'rh', 'servidor');

drop policy if exists "afastamentos_documentos_select_authenticated" on storage.objects;
create policy "afastamentos_documentos_select_authorized"
on storage.objects for select
to authenticated
using (
  bucket_id = 'afastamentos-documentos'
  and public.current_user_has_permission('afastamentos:visualizar_documento')
);

do $$
declare
  target_user_id uuid;
begin
  for target_user_id in
    select distinct usuario_id
    from app_auth.usuario_perfis
  loop
    perform app_auth.sync_user_auth_claims(target_user_id);
  end loop;
end;
$$;
