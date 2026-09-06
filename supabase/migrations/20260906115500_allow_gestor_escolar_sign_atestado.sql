insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
join app_auth.permissoes pe on (pe.recurso, pe.acao) in (
  ('afastamentos', 'gerar_documento'),
  ('afastamentos', 'assinar_documento'),
  ('afastamentos', 'validar_documento')
)
where p.nome in ('gestor_escolar', 'educacao')
on conflict (perfil_id, permissao_id) do nothing;

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
end $$;
