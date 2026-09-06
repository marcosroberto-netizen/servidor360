create schema if not exists app_auth;

alter table if exists public.usuarios set schema app_auth;
alter table if exists public.perfis set schema app_auth;
alter table if exists public.permissoes set schema app_auth;
alter table if exists public.usuario_perfis set schema app_auth;
alter table if exists public.usuario_unidades set schema app_auth;
alter table if exists public.usuario_setores set schema app_auth;
alter table if exists public.perfil_permissoes set schema app_auth;

create or replace function public.user_authz_payload(user_id uuid)
returns jsonb
language sql
security definer
set search_path = public, app_auth, auth
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
        join public.unidades u on u.id = uu.unidade_id
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
        join public.setores s on s.id = us.setor_id
        where us.usuario_id = user_id
          and s.ativo
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.sync_user_auth_claims(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_auth, auth
as $$
declare
  claims jsonb;
begin
  if user_id is null then
    return;
  end if;

  select public.user_authz_payload(user_id) into claims;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || claims
  where id = user_id;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, app_auth, auth
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

  perform public.sync_user_auth_claims(new.id);

  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, app_auth, auth
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

create or replace function public.handle_authz_changed()
returns trigger
language plpgsql
security definer
set search_path = public, app_auth, auth
as $$
begin
  perform public.sync_user_auth_claims(coalesce(new.usuario_id, old.usuario_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.current_user_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public, app_auth, auth
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
set search_path = public, app_auth, auth
as $$
  select exists (
    select 1
    from jsonb_array_elements_text(public.user_authz_payload(auth.uid()) -> 'permissoes') as permissions(value)
    where permissions.value in ('*', permission_name)
  );
$$;

create or replace function public.get_current_user_authz()
returns jsonb
language sql
stable
security definer
set search_path = public, app_auth, auth
as $$
  select jsonb_build_object(
    'usuario',
    (
      select to_jsonb(u)
      from app_auth.usuarios u
      where u.id = auth.uid()
    ),
    'perfis',
    public.user_authz_payload(auth.uid()) -> 'perfis',
    'permissoes',
    public.user_authz_payload(auth.uid()) -> 'permissoes',
    'unidades',
    public.user_authz_payload(auth.uid()) -> 'unidades',
    'setores',
    public.user_authz_payload(auth.uid()) -> 'setores'
  );
$$;

create or replace function public.current_user_has_unidade(unidade uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_auth, auth
as $$
  select exists (
    select 1
    from app_auth.usuario_unidades uu
    where uu.usuario_id = auth.uid()
      and uu.unidade_id = unidade
  );
$$;

create or replace function public.current_user_is_gestor_escolar()
returns boolean
language sql
stable
security definer
set search_path = public, app_auth, auth
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

drop trigger if exists on_usuario_perfis_changed on app_auth.usuario_perfis;
create trigger on_usuario_perfis_changed
after insert or update or delete on app_auth.usuario_perfis
for each row execute function public.handle_authz_changed();

drop trigger if exists on_usuario_unidades_changed on app_auth.usuario_unidades;
create trigger on_usuario_unidades_changed
after insert or update or delete on app_auth.usuario_unidades
for each row execute function public.handle_authz_changed();

drop trigger if exists on_usuario_setores_changed on app_auth.usuario_setores;
create trigger on_usuario_setores_changed
after insert or update or delete on app_auth.usuario_setores
for each row execute function public.handle_authz_changed();

grant execute on function public.get_current_user_authz() to authenticated;
grant execute on function public.current_user_has_role(text) to authenticated;
grant execute on function public.current_user_has_permission(text) to authenticated;
grant execute on function public.current_user_has_unidade(uuid) to authenticated;
grant execute on function public.current_user_is_gestor_escolar() to authenticated;
