create index movimentacoes_criado_por_idx
on afastamentos.movimentacoes (criado_por)
where criado_por is not null;

create index complementacoes_solicitada_por_idx
on afastamentos.complementacoes (solicitada_por)
where solicitada_por is not null;

create index complementacoes_respondida_por_idx
on afastamentos.complementacoes (respondida_por)
where respondida_por is not null;

create index devolutivas_responsavel_id_idx
on afastamentos.devolutivas (responsavel_id)
where responsavel_id is not null;

create index providencias_responsavel_id_idx
on afastamentos.providencias (responsavel_id)
where responsavel_id is not null;

create index documentos_digitais_criado_por_idx
on afastamentos.documentos_digitais (criado_por)
where criado_por is not null;

create index documentos_digitais_substituido_por_idx
on afastamentos.documentos_digitais (substituido_por)
where substituido_por is not null;

alter function public.set_updated_at() set search_path = public;

revoke all on function app_auth.user_authz_payload(uuid) from public, anon, authenticated;
revoke all on function app_auth.sync_user_auth_claims(uuid) from public, anon, authenticated;
revoke all on function app_auth.handle_new_auth_user() from public, anon, authenticated;
revoke all on function app_auth.handle_auth_user_updated() from public, anon, authenticated;
revoke all on function app_auth.handle_authz_changed() from public, anon, authenticated;

revoke all on function afastamentos.next_protocolo() from public, anon, authenticated;
revoke all on function afastamentos.next_documento_digital_protocolo() from public, anon, authenticated;
revoke all on function afastamentos.add_movimentacao(uuid, text, text, text, text, text, text)
from public, anon, authenticated;

revoke all on function public.get_current_user_authz() from public, anon;
revoke all on function public.current_user_has_role(text) from public, anon;
revoke all on function public.current_user_has_permission(text) from public, anon;
revoke all on function public.current_user_has_unidade(uuid) from public, anon;
revoke all on function public.current_user_is_gestor_escolar() from public, anon;
revoke all on function public.current_user_can_access_afastamento(uuid) from public, anon;
revoke all on function public.current_user_can_access_ocupacional() from public, anon;
revoke all on function public.criar_afastamento(jsonb) from public, anon;
revoke all on function public.registrar_analise_afastamento(uuid, text, text, text) from public, anon;
revoke all on function public.responder_complementacao_afastamento(uuid, text, text, text) from public, anon;
revoke all on function public.emitir_devolutiva_afastamento(uuid, text, text, text, boolean) from public, anon;
revoke all on function public.registrar_providencia_afastamento(uuid, text, boolean) from public, anon;
revoke all on function public.gerar_documento_digital_afastamento(uuid, text, text, jsonb, text) from public, anon;
revoke all on function public.assinar_documento_digital_afastamento(uuid, text, text) from public, anon;
revoke all on function public.validar_documento_digital_afastamento(text) from public, anon;

drop policy if exists "perfis_admin_all" on app_auth.perfis;
create policy "perfis_insert" on app_auth.perfis
for insert to authenticated
with check (public.current_user_has_permission('perfis:manage'));
create policy "perfis_update" on app_auth.perfis
for update to authenticated
using (public.current_user_has_permission('perfis:manage'))
with check (public.current_user_has_permission('perfis:manage'));
create policy "perfis_delete" on app_auth.perfis
for delete to authenticated
using (public.current_user_has_permission('perfis:manage'));

drop policy if exists "permissoes_admin_all" on app_auth.permissoes;
create policy "permissoes_insert" on app_auth.permissoes
for insert to authenticated
with check (public.current_user_has_permission('permissoes:manage'));
create policy "permissoes_update" on app_auth.permissoes
for update to authenticated
using (public.current_user_has_permission('permissoes:manage'))
with check (public.current_user_has_permission('permissoes:manage'));
create policy "permissoes_delete" on app_auth.permissoes
for delete to authenticated
using (public.current_user_has_permission('permissoes:manage'));

drop policy if exists "perfil_permissoes_admin_all" on app_auth.perfil_permissoes;
create policy "perfil_permissoes_insert" on app_auth.perfil_permissoes
for insert to authenticated
with check (public.current_user_has_permission('permissoes:manage'));
create policy "perfil_permissoes_update" on app_auth.perfil_permissoes
for update to authenticated
using (public.current_user_has_permission('permissoes:manage'))
with check (public.current_user_has_permission('permissoes:manage'));
create policy "perfil_permissoes_delete" on app_auth.perfil_permissoes
for delete to authenticated
using (public.current_user_has_permission('permissoes:manage'));

drop policy if exists "usuario_perfis_admin_all" on app_auth.usuario_perfis;
drop policy if exists "usuario_perfis_select_self_or_admin" on app_auth.usuario_perfis;
create policy "usuario_perfis_select" on app_auth.usuario_perfis
for select to authenticated
using (
  usuario_id = (select auth.uid())
  or public.current_user_has_permission('usuarios:manage')
);
create policy "usuario_perfis_insert" on app_auth.usuario_perfis
for insert to authenticated
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuario_perfis_update" on app_auth.usuario_perfis
for update to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuario_perfis_delete" on app_auth.usuario_perfis
for delete to authenticated
using (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuario_unidades_admin_all" on app_auth.usuario_unidades;
drop policy if exists "usuario_unidades_select_self_or_admin" on app_auth.usuario_unidades;
create policy "usuario_unidades_select" on app_auth.usuario_unidades
for select to authenticated
using (
  usuario_id = (select auth.uid())
  or public.current_user_has_permission('usuarios:manage')
);
create policy "usuario_unidades_insert" on app_auth.usuario_unidades
for insert to authenticated
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuario_unidades_update" on app_auth.usuario_unidades
for update to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuario_unidades_delete" on app_auth.usuario_unidades
for delete to authenticated
using (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuario_setores_admin_all" on app_auth.usuario_setores;
drop policy if exists "usuario_setores_select_self_or_admin" on app_auth.usuario_setores;
create policy "usuario_setores_select" on app_auth.usuario_setores
for select to authenticated
using (
  usuario_id = (select auth.uid())
  or public.current_user_has_permission('usuarios:manage')
);
create policy "usuario_setores_insert" on app_auth.usuario_setores
for insert to authenticated
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuario_setores_update" on app_auth.usuario_setores
for update to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuario_setores_delete" on app_auth.usuario_setores
for delete to authenticated
using (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuarios_admin_all" on app_auth.usuarios;
drop policy if exists "usuarios_select_self_or_admin" on app_auth.usuarios;
drop policy if exists "usuarios_update_self_or_admin" on app_auth.usuarios;
create policy "usuarios_select" on app_auth.usuarios
for select to authenticated
using (
  id = (select auth.uid())
  or public.current_user_has_permission('usuarios:manage')
);
create policy "usuarios_insert" on app_auth.usuarios
for insert to authenticated
with check (public.current_user_has_permission('usuarios:manage'));
create policy "usuarios_update" on app_auth.usuarios
for update to authenticated
using (
  id = (select auth.uid())
  or public.current_user_has_permission('usuarios:manage')
)
with check (
  id = (select auth.uid())
  or public.current_user_has_permission('usuarios:manage')
);
create policy "usuarios_delete" on app_auth.usuarios
for delete to authenticated
using (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "unidades_admin_all" on organizacional.unidades;
create policy "unidades_insert" on organizacional.unidades
for insert to authenticated
with check (public.current_user_has_permission('unidades:manage'));
create policy "unidades_update" on organizacional.unidades
for update to authenticated
using (public.current_user_has_permission('unidades:manage'))
with check (public.current_user_has_permission('unidades:manage'));
create policy "unidades_delete" on organizacional.unidades
for delete to authenticated
using (public.current_user_has_permission('unidades:manage'));

drop policy if exists "setores_admin_all" on organizacional.setores;
create policy "setores_insert" on organizacional.setores
for insert to authenticated
with check (public.current_user_has_permission('setores:manage'));
create policy "setores_update" on organizacional.setores
for update to authenticated
using (public.current_user_has_permission('setores:manage'))
with check (public.current_user_has_permission('setores:manage'));
create policy "setores_delete" on organizacional.setores
for delete to authenticated
using (public.current_user_has_permission('setores:manage'));
