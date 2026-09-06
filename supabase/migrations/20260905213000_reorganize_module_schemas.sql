create schema if not exists organizacional;
create schema if not exists servidores;
create schema if not exists afastamentos;

alter table if exists public.unidades set schema organizacional;
alter table if exists public.setores set schema organizacional;
alter table if exists public.servidores set schema servidores;
alter table if exists public.prontuarios set schema servidores;
alter table if exists public.afastamentos set schema afastamentos;

alter function public.user_authz_payload(uuid) set schema app_auth;
alter function public.sync_user_auth_claims(uuid) set schema app_auth;
alter function public.handle_new_auth_user() set schema app_auth;
alter function public.handle_auth_user_updated() set schema app_auth;
alter function public.handle_authz_changed() set schema app_auth;

create or replace function app_auth.user_authz_payload(user_id uuid)
returns jsonb
language sql
security definer
set search_path = app_auth, organizacional, public, auth
as $$
  select jsonb_build_object(
    'perfis',
    coalesce(
      (
        select jsonb_agg(distinct p.nome order by p.nome)
        from app_auth.usuario_perfis up
        join app_auth.perfis p on p.id = up.perfil_id
        where up.usuario_id = user_id
          and p.ativo
      ),
      '[]'::jsonb
    ),
    'permissoes',
    coalesce(
      (
        select jsonb_agg(distinct
          case
            when pe.recurso = '*' and pe.acao = '*' then '*'
            else pe.recurso || ':' || pe.acao
          end
          order by
            case
              when pe.recurso = '*' and pe.acao = '*' then '*'
              else pe.recurso || ':' || pe.acao
            end
        )
        from app_auth.usuario_perfis up
        join app_auth.perfis p on p.id = up.perfil_id
        join app_auth.perfil_permissoes pp on pp.perfil_id = p.id
        join app_auth.permissoes pe on pe.id = pp.permissao_id
        where up.usuario_id = user_id
          and p.ativo
      ),
      '[]'::jsonb
    ),
    'unidades',
    coalesce(
      (
        select jsonb_agg(distinct uu.unidade_id order by uu.unidade_id)
        from app_auth.usuario_unidades uu
        join organizacional.unidades u on u.id = uu.unidade_id
        where uu.usuario_id = user_id
          and u.ativo
      ),
      '[]'::jsonb
    ),
    'setores',
    coalesce(
      (
        select jsonb_agg(distinct us.setor_id order by us.setor_id)
        from app_auth.usuario_setores us
        join organizacional.setores s on s.id = us.setor_id
        where us.usuario_id = user_id
          and s.ativo
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function app_auth.sync_user_auth_claims(user_id uuid)
returns void
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
declare
  claims jsonb;
begin
  if user_id is null then
    return;
  end if;

  select app_auth.user_authz_payload(user_id) into claims;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || claims
  where id = user_id;
end;
$$;

create or replace function app_auth.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
declare
  default_perfil_id uuid;
begin
  insert into app_auth.usuarios (id, email, nome_completo, cpf)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nome_completo', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'Usuario'), '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'cpf', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nome_completo = excluded.nome_completo,
    cpf = coalesce(excluded.cpf, app_auth.usuarios.cpf);

  select id into default_perfil_id
  from app_auth.perfis
  where nome = 'servidor';

  if default_perfil_id is not null then
    insert into app_auth.usuario_perfis (usuario_id, perfil_id)
    values (new.id, default_perfil_id)
    on conflict (usuario_id, perfil_id) do nothing;
  end if;

  perform app_auth.sync_user_auth_claims(new.id);

  return new;
end;
$$;

create or replace function app_auth.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
begin
  update app_auth.usuarios
  set
    email = coalesce(new.email, app_auth.usuarios.email),
    nome_completo = coalesce(
      nullif(new.raw_user_meta_data ->> 'nome_completo', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      app_auth.usuarios.nome_completo
    ),
    cpf = coalesce(nullif(new.raw_user_meta_data ->> 'cpf', ''), app_auth.usuarios.cpf)
  where id = new.id;

  return new;
end;
$$;

create or replace function app_auth.handle_authz_changed()
returns trigger
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
begin
  perform app_auth.sync_user_auth_claims(coalesce(new.usuario_id, old.usuario_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_auth.handle_new_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function app_auth.handle_auth_user_updated();

drop trigger if exists on_usuario_perfis_changed on app_auth.usuario_perfis;
create trigger on_usuario_perfis_changed
after insert or update or delete on app_auth.usuario_perfis
for each row execute function app_auth.handle_authz_changed();

drop trigger if exists on_usuario_unidades_changed on app_auth.usuario_unidades;
create trigger on_usuario_unidades_changed
after insert or update or delete on app_auth.usuario_unidades
for each row execute function app_auth.handle_authz_changed();

drop trigger if exists on_usuario_setores_changed on app_auth.usuario_setores;
create trigger on_usuario_setores_changed
after insert or update or delete on app_auth.usuario_setores
for each row execute function app_auth.handle_authz_changed();

create or replace function public.current_user_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = app_auth, public, auth
as $$
  select exists (
    select 1
    from app_auth.usuario_perfis up
    join app_auth.perfis p on p.id = up.perfil_id
    where up.usuario_id = auth.uid()
      and p.nome = role_name
      and p.ativo
  );
$$;

create or replace function public.current_user_has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = app_auth, public, auth
as $$
  select exists (
    select 1
    from jsonb_array_elements_text(app_auth.user_authz_payload(auth.uid()) -> 'permissoes') as permissions(value)
    where permissions.value in ('*', permission_name)
  );
$$;

create or replace function public.current_user_has_unidade(unidade uuid)
returns boolean
language sql
stable
security definer
set search_path = app_auth, organizacional, public, auth
as $$
  select exists (
    select 1
    from app_auth.usuario_unidades uu
    join organizacional.unidades u on u.id = uu.unidade_id
    where uu.usuario_id = auth.uid()
      and uu.unidade_id = unidade
      and u.ativo
  );
$$;

create or replace function public.current_user_is_gestor_escolar()
returns boolean
language sql
stable
security definer
set search_path = app_auth, public, auth
as $$
  select exists (
    select 1
    from app_auth.usuario_perfis up
    join app_auth.perfis p on p.id = up.perfil_id
    where up.usuario_id = auth.uid()
      and p.nome = 'gestor_escolar'
      and p.ativo
  );
$$;

create or replace function public.get_current_user_authz()
returns jsonb
language sql
stable
security definer
set search_path = app_auth, public, auth
as $$
  select jsonb_build_object(
    'usuario',
    (
      select to_jsonb(u)
      from app_auth.usuarios u
      where u.id = auth.uid()
    ),
    'perfis',
    app_auth.user_authz_payload(auth.uid()) -> 'perfis',
    'permissoes',
    app_auth.user_authz_payload(auth.uid()) -> 'permissoes',
    'unidades',
    app_auth.user_authz_payload(auth.uid()) -> 'unidades',
    'setores',
    app_auth.user_authz_payload(auth.uid()) -> 'setores'
  );
$$;

drop policy if exists "unidades_select_authenticated" on organizacional.unidades;
create policy "unidades_select_authenticated"
on organizacional.unidades for select
to authenticated
using (true);

drop policy if exists "unidades_admin_all" on organizacional.unidades;
create policy "unidades_admin_all"
on organizacional.unidades for all
to authenticated
using (public.current_user_has_permission('unidades:manage'))
with check (public.current_user_has_permission('unidades:manage'));

drop policy if exists "setores_select_authenticated" on organizacional.setores;
create policy "setores_select_authenticated"
on organizacional.setores for select
to authenticated
using (true);

drop policy if exists "setores_admin_all" on organizacional.setores;
create policy "setores_admin_all"
on organizacional.setores for all
to authenticated
using (public.current_user_has_permission('setores:manage'))
with check (public.current_user_has_permission('setores:manage'));

drop policy if exists "servidores_select_by_permission_scope" on servidores.servidores;
create policy "servidores_select_by_permission_scope"
on servidores.servidores for select
to authenticated
using (
  public.current_user_has_permission('servidores:read')
  or (
    public.current_user_has_permission('afastamentos:create')
    and public.current_user_is_gestor_escolar()
    and public.current_user_has_unidade(unidade_id)
  )
);

drop policy if exists "servidores_admin_write" on servidores.servidores;
create policy "servidores_admin_write"
on servidores.servidores for all
to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));

drop policy if exists "prontuarios_select_by_servidor_scope" on servidores.prontuarios;
create policy "prontuarios_select_by_servidor_scope"
on servidores.prontuarios for select
to authenticated
using (
  public.current_user_has_permission('prontuario:read')
  or exists (
    select 1
    from servidores.servidores s
    where s.id = prontuarios.servidor_id
      and public.current_user_has_permission('afastamentos:create')
      and public.current_user_is_gestor_escolar()
      and public.current_user_has_unidade(s.unidade_id)
  )
);

drop policy if exists "afastamentos_select_by_permission_scope" on afastamentos.afastamentos;
create policy "afastamentos_select_by_permission_scope"
on afastamentos.afastamentos for select
to authenticated
using (
  public.current_user_has_permission('afastamentos:read')
  or (
    public.current_user_has_permission('afastamentos:create')
    and exists (
      select 1
      from servidores.servidores s
      where s.id = afastamentos.servidor_id
        and public.current_user_has_unidade(s.unidade_id)
    )
  )
);

drop policy if exists "afastamentos_insert_by_servidor_scope" on afastamentos.afastamentos;
create policy "afastamentos_insert_by_servidor_scope"
on afastamentos.afastamentos for insert
to authenticated
with check (
  public.current_user_has_permission('afastamentos:create')
  and iniciado_por = auth.uid()
  and exists (
    select 1
    from servidores.servidores s
    where s.id = afastamentos.servidor_id
      and (
        not public.current_user_is_gestor_escolar()
        or public.current_user_has_unidade(s.unidade_id)
      )
  )
);

grant usage on schema organizacional to authenticated;
grant usage on schema servidores to authenticated;
grant usage on schema afastamentos to authenticated;

grant select on organizacional.unidades to authenticated;
grant select on organizacional.setores to authenticated;
grant insert, update, delete on organizacional.unidades to authenticated;
grant insert, update, delete on organizacional.setores to authenticated;

grant select on servidores.servidores to authenticated;
grant select on servidores.prontuarios to authenticated;
grant insert, update, delete on servidores.servidores to authenticated;
grant insert, update, delete on servidores.prontuarios to authenticated;

grant select, insert on afastamentos.afastamentos to authenticated;

grant execute on function public.get_current_user_authz() to authenticated;
grant execute on function public.current_user_has_role(text) to authenticated;
grant execute on function public.current_user_has_permission(text) to authenticated;
grant execute on function public.current_user_has_unidade(uuid) to authenticated;
grant execute on function public.current_user_is_gestor_escolar() to authenticated;
