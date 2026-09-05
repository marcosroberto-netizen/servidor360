create extension if not exists "pgcrypto";

create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'administrativa',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nome_completo text not null,
  cpf text unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.perfis (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  recurso text not null,
  acao text not null,
  created_at timestamptz not null default now(),
  unique (recurso, acao)
);

create table if not exists public.usuario_perfis (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, perfil_id)
);

create table if not exists public.usuario_unidades (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, unidade_id)
);

create table if not exists public.perfil_permissoes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  permissao_id uuid not null references public.permissoes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (perfil_id, permissao_id)
);

create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_usuarios_cpf on public.usuarios(cpf);
create index if not exists idx_usuarios_ativo on public.usuarios(ativo);
create index if not exists idx_usuario_perfis_usuario on public.usuario_perfis(usuario_id);
create index if not exists idx_usuario_perfis_perfil on public.usuario_perfis(perfil_id);
create index if not exists idx_usuario_unidades_usuario on public.usuario_unidades(usuario_id);
create index if not exists idx_usuario_unidades_unidade on public.usuario_unidades(unidade_id);
create index if not exists idx_perfil_permissoes_perfil on public.perfil_permissoes(perfil_id);
create index if not exists idx_perfil_permissoes_permissao on public.perfil_permissoes(permissao_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_unidades_updated_at on public.unidades;
create trigger set_unidades_updated_at
before update on public.unidades
for each row execute function public.set_updated_at();

drop trigger if exists set_usuarios_updated_at on public.usuarios;
create trigger set_usuarios_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists set_perfis_updated_at on public.perfis;
create trigger set_perfis_updated_at
before update on public.perfis
for each row execute function public.set_updated_at();

insert into public.perfis (nome, descricao)
values
  ('administrador', 'Acesso total ao sistema'),
  ('rh', 'Gestão de RH e servidores'),
  ('medico', 'Acesso ao prontuário médico'),
  ('enfermeiro', 'Acesso básico ao prontuário'),
  ('cas', 'Controle e Avaliação Social'),
  ('servidor', 'Acesso básico ao portal do servidor')
on conflict (nome) do update
set descricao = excluded.descricao;

insert into public.permissoes (nome, recurso, acao)
values
  ('Acesso total', '*', '*'),
  ('Ler servidores', 'servidores', 'read'),
  ('Escrever servidores', 'servidores', 'write'),
  ('Excluir servidores', 'servidores', 'delete'),
  ('Ler afastamentos', 'afastamentos', 'read'),
  ('Escrever afastamentos', 'afastamentos', 'write'),
  ('Excluir afastamentos', 'afastamentos', 'delete'),
  ('Registrar devolutiva de afastamento', 'afastamentos', 'devolutiva'),
  ('Ler prontuário', 'prontuario', 'read'),
  ('Escrever prontuário', 'prontuario', 'write'),
  ('Ler CAS', 'cas', 'read'),
  ('Escrever CAS', 'cas', 'write'),
  ('Acessar portal', 'portal', 'read')
on conflict (recurso, acao) do update
set nome = excluded.nome;

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on pe.recurso = '*' and pe.acao = '*'
where p.nome = 'administrador'
on conflict (perfil_id, permissao_id) do nothing;

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on (pe.recurso, pe.acao) in (
  ('portal', 'read'),
  ('servidores', 'read'),
  ('servidores', 'write'),
  ('afastamentos', 'read'),
  ('afastamentos', 'write')
)
where p.nome = 'rh'
on conflict (perfil_id, permissao_id) do nothing;

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on (pe.recurso, pe.acao) in (
  ('portal', 'read'),
  ('prontuario', 'read'),
  ('prontuario', 'write'),
  ('afastamentos', 'read')
)
where p.nome = 'medico'
on conflict (perfil_id, permissao_id) do nothing;

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on (pe.recurso, pe.acao) in (
  ('portal', 'read'),
  ('prontuario', 'read')
)
where p.nome = 'enfermeiro'
on conflict (perfil_id, permissao_id) do nothing;

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on (pe.recurso, pe.acao) in (
  ('portal', 'read'),
  ('cas', 'read'),
  ('cas', 'write')
)
where p.nome = 'cas'
on conflict (perfil_id, permissao_id) do nothing;

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on pe.recurso = 'portal' and pe.acao = 'read'
where p.nome = 'servidor'
on conflict (perfil_id, permissao_id) do nothing;

create or replace function public.user_authz_payload(user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'perfis',
    coalesce(
      (
        select jsonb_agg(distinct p.nome order by p.nome)
        from public.usuario_perfis up
        join public.perfis p on p.id = up.perfil_id
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
        from public.usuario_perfis up
        join public.perfis p on p.id = up.perfil_id
        join public.perfil_permissoes pp on pp.perfil_id = p.id
        join public.permissoes pe on pe.id = pp.permissao_id
        where up.usuario_id = user_id
          and p.ativo
      ),
      '[]'::jsonb
    ),
    'unidades',
    coalesce(
      (
        select jsonb_agg(distinct uu.unidade_id order by uu.unidade_id)
        from public.usuario_unidades uu
        join public.unidades u on u.id = uu.unidade_id
        where uu.usuario_id = user_id
          and u.ativo
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.sync_user_auth_claims(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
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
set search_path = public, auth
as $$
declare
  default_perfil_id uuid;
begin
  insert into public.usuarios (id, email, nome_completo, cpf)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nome_completo', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'Usuário'), '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'cpf', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nome_completo = excluded.nome_completo,
    cpf = coalesce(excluded.cpf, public.usuarios.cpf);

  select id into default_perfil_id
  from public.perfis
  where nome = 'servidor';

  if default_perfil_id is not null then
    insert into public.usuario_perfis (usuario_id, perfil_id)
    values (new.id, default_perfil_id)
    on conflict (usuario_id, perfil_id) do nothing;
  end if;

  perform public.sync_user_auth_claims(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.usuarios
  set
    email = coalesce(new.email, public.usuarios.email),
    nome_completo = coalesce(
      nullif(new.raw_user_meta_data ->> 'nome_completo', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      public.usuarios.nome_completo
    ),
    cpf = coalesce(nullif(new.raw_user_meta_data ->> 'cpf', ''), public.usuarios.cpf)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_updated();

create or replace function public.handle_authz_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_user_auth_claims(coalesce(new.usuario_id, old.usuario_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_usuario_perfis_changed on public.usuario_perfis;
create trigger on_usuario_perfis_changed
after insert or update or delete on public.usuario_perfis
for each row execute function public.handle_authz_changed();

drop trigger if exists on_usuario_unidades_changed on public.usuario_unidades;
create trigger on_usuario_unidades_changed
after insert or update or delete on public.usuario_unidades
for each row execute function public.handle_authz_changed();

create or replace function public.current_user_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuario_perfis up
    join public.perfis p on p.id = up.perfil_id
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
set search_path = public
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
set search_path = public
as $$
  select jsonb_build_object(
    'usuario',
    (
      select to_jsonb(u)
      from public.usuarios u
      where u.id = auth.uid()
    ),
    'perfis',
    public.user_authz_payload(auth.uid()) -> 'perfis',
    'permissoes',
    public.user_authz_payload(auth.uid()) -> 'permissoes',
    'unidades',
    public.user_authz_payload(auth.uid()) -> 'unidades'
  );
$$;

alter table public.unidades enable row level security;
alter table public.usuarios enable row level security;
alter table public.perfis enable row level security;
alter table public.permissoes enable row level security;
alter table public.usuario_perfis enable row level security;
alter table public.usuario_unidades enable row level security;
alter table public.perfil_permissoes enable row level security;

drop policy if exists "usuarios_select_self_or_admin" on public.usuarios;
create policy "usuarios_select_self_or_admin"
on public.usuarios for select
to authenticated
using (id = auth.uid() or public.current_user_has_role('administrador'));

drop policy if exists "usuarios_update_self_or_admin" on public.usuarios;
create policy "usuarios_update_self_or_admin"
on public.usuarios for update
to authenticated
using (id = auth.uid() or public.current_user_has_role('administrador'))
with check (id = auth.uid() or public.current_user_has_role('administrador'));

drop policy if exists "unidades_select_authenticated" on public.unidades;
create policy "unidades_select_authenticated"
on public.unidades for select
to authenticated
using (true);

drop policy if exists "perfis_select_authenticated" on public.perfis;
create policy "perfis_select_authenticated"
on public.perfis for select
to authenticated
using (true);

drop policy if exists "permissoes_select_authenticated" on public.permissoes;
create policy "permissoes_select_authenticated"
on public.permissoes for select
to authenticated
using (true);

drop policy if exists "perfil_permissoes_select_authenticated" on public.perfil_permissoes;
create policy "perfil_permissoes_select_authenticated"
on public.perfil_permissoes for select
to authenticated
using (true);

drop policy if exists "usuario_perfis_select_self_or_admin" on public.usuario_perfis;
create policy "usuario_perfis_select_self_or_admin"
on public.usuario_perfis for select
to authenticated
using (usuario_id = auth.uid() or public.current_user_has_role('administrador'));

drop policy if exists "usuario_unidades_select_self_or_admin" on public.usuario_unidades;
create policy "usuario_unidades_select_self_or_admin"
on public.usuario_unidades for select
to authenticated
using (usuario_id = auth.uid() or public.current_user_has_role('administrador'));

drop policy if exists "perfis_admin_all" on public.perfis;
create policy "perfis_admin_all"
on public.perfis for all
to authenticated
using (public.current_user_has_role('administrador'))
with check (public.current_user_has_role('administrador'));

drop policy if exists "permissoes_admin_all" on public.permissoes;
create policy "permissoes_admin_all"
on public.permissoes for all
to authenticated
using (public.current_user_has_role('administrador'))
with check (public.current_user_has_role('administrador'));

drop policy if exists "usuario_perfis_admin_all" on public.usuario_perfis;
create policy "usuario_perfis_admin_all"
on public.usuario_perfis for all
to authenticated
using (public.current_user_has_role('administrador'))
with check (public.current_user_has_role('administrador'));

drop policy if exists "usuario_unidades_admin_all" on public.usuario_unidades;
create policy "usuario_unidades_admin_all"
on public.usuario_unidades for all
to authenticated
using (public.current_user_has_role('administrador'))
with check (public.current_user_has_role('administrador'));

drop policy if exists "perfil_permissoes_admin_all" on public.perfil_permissoes;
create policy "perfil_permissoes_admin_all"
on public.perfil_permissoes for all
to authenticated
using (public.current_user_has_role('administrador'))
with check (public.current_user_has_role('administrador'));

grant usage on schema public to anon, authenticated;
grant execute on function public.get_current_user_authz() to authenticated;
grant execute on function public.current_user_has_permission(text) to authenticated;
grant select on public.usuarios to authenticated;
grant select on public.perfis to authenticated;
grant select on public.permissoes to authenticated;
grant select on public.usuario_perfis to authenticated;
grant select on public.usuario_unidades to authenticated;
grant select on public.perfil_permissoes to authenticated;
grant select on public.unidades to authenticated;
