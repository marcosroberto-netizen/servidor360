create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unidade_id, nome)
);

create table if not exists public.usuario_setores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  setor_id uuid not null references public.setores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, setor_id)
);

create index if not exists idx_setores_unidade on public.setores(unidade_id);
create index if not exists idx_usuario_setores_usuario on public.usuario_setores(usuario_id);
create index if not exists idx_usuario_setores_setor on public.usuario_setores(setor_id);

drop trigger if exists set_setores_updated_at on public.setores;
create trigger set_setores_updated_at
before update on public.setores
for each row execute function public.set_updated_at();

insert into public.unidades (nome, tipo)
values ('Secretaria Municipal de Educação', 'secretaria')
on conflict do nothing;

insert into public.perfis (nome, descricao)
values
  ('gestor_escolar', 'Gestor de unidade escolar: registra afastamentos, acompanha processos e responde pendências da própria unidade'),
  ('educacao', 'Secretaria de Educação: acompanha processos, indicadores e servidores da rede conforme escopo permitido')
on conflict (nome) do update
set descricao = excluded.descricao;

insert into public.permissoes (nome, recurso, acao)
values
  ('Administrar usuários', 'usuarios', 'manage'),
  ('Administrar perfis', 'perfis', 'manage'),
  ('Administrar permissões', 'permissoes', 'manage'),
  ('Administrar unidades', 'unidades', 'manage'),
  ('Administrar setores', 'setores', 'manage'),
  ('Ler unidades', 'unidades', 'read'),
  ('Ler setores', 'setores', 'read'),
  ('Ler documentos', 'documentos', 'read'),
  ('Enviar documentos', 'documentos', 'write'),
  ('Ler documentos administrativos', 'documentos_administrativos', 'read'),
  ('Ler documentos funcionais', 'documentos_funcionais', 'read'),
  ('Ler documentos ocupacionais restritos', 'documentos_ocupacionais', 'read'),
  ('Ler prontuário ocupacional restrito', 'prontuario_ocupacional', 'read'),
  ('Escrever prontuário ocupacional restrito', 'prontuario_ocupacional', 'write'),
  ('Iniciar afastamento', 'afastamentos', 'create'),
  ('Responder complementação de afastamento', 'afastamentos', 'complementar'),
  ('Solicitar complementação de afastamento', 'afastamentos', 'solicitar_complementacao'),
  ('Encaminhar afastamento para avaliação', 'afastamentos', 'encaminhar_avaliacao'),
  ('Analisar afastamento', 'afastamentos', 'analisar'),
  ('Emitir devolutiva de afastamento', 'afastamentos', 'emitir_devolutiva'),
  ('Ler devolutiva de afastamento', 'afastamentos', 'ler_devolutiva'),
  ('Registrar providência administrativa de afastamento', 'afastamentos', 'registrar_providencia'),
  ('Concluir afastamento', 'afastamentos', 'concluir'),
  ('Ler fila do CAS', 'cas', 'fila'),
  ('Ler fila do RH', 'rh', 'fila'),
  ('Ler visão da Educação', 'educacao', 'read'),
  ('Ler indicadores gerenciais', 'indicadores', 'read')
on conflict (recurso, acao) do update
set nome = excluded.nome;

with admin_forbidden_permissions as (
  select pe.id
  from public.permissoes pe
  where (pe.recurso, pe.acao) in (
    ('*', '*'),
    ('prontuario_ocupacional', 'read'),
    ('prontuario_ocupacional', 'write'),
    ('documentos_ocupacionais', 'read')
  )
)
delete from public.perfil_permissoes pp
using public.perfis p, admin_forbidden_permissions afp
where pp.perfil_id = p.id
  and pp.permissao_id = afp.id
  and p.nome = 'administrador';

with role_permissions(role_name, recurso, acao) as (
  values
    ('administrador', 'portal', 'read'),
    ('administrador', 'usuarios', 'manage'),
    ('administrador', 'perfis', 'manage'),
    ('administrador', 'permissoes', 'manage'),
    ('administrador', 'unidades', 'manage'),
    ('administrador', 'setores', 'manage'),
    ('administrador', 'unidades', 'read'),
    ('administrador', 'setores', 'read'),
    ('administrador', 'servidores', 'read'),
    ('administrador', 'servidores', 'write'),
    ('administrador', 'servidores', 'delete'),
    ('administrador', 'prontuario', 'read'),
    ('administrador', 'prontuario', 'write'),
    ('administrador', 'documentos', 'read'),
    ('administrador', 'documentos', 'write'),
    ('administrador', 'documentos_administrativos', 'read'),
    ('administrador', 'documentos_funcionais', 'read'),
    ('administrador', 'afastamentos', 'read'),
    ('administrador', 'afastamentos', 'write'),
    ('administrador', 'afastamentos', 'delete'),
    ('administrador', 'afastamentos', 'create'),
    ('administrador', 'afastamentos', 'complementar'),
    ('administrador', 'afastamentos', 'ler_devolutiva'),
    ('administrador', 'afastamentos', 'registrar_providencia'),
    ('administrador', 'afastamentos', 'concluir'),
    ('administrador', 'educacao', 'read'),
    ('administrador', 'indicadores', 'read'),

    ('gestor_escolar', 'portal', 'read'),
    ('gestor_escolar', 'unidades', 'read'),
    ('gestor_escolar', 'setores', 'read'),
    ('gestor_escolar', 'afastamentos', 'read'),
    ('gestor_escolar', 'afastamentos', 'create'),
    ('gestor_escolar', 'afastamentos', 'write'),
    ('gestor_escolar', 'afastamentos', 'complementar'),
    ('gestor_escolar', 'afastamentos', 'ler_devolutiva'),

    ('educacao', 'portal', 'read'),
    ('educacao', 'educacao', 'read'),
    ('educacao', 'unidades', 'read'),
    ('educacao', 'setores', 'read'),
    ('educacao', 'servidores', 'read'),
    ('educacao', 'documentos_funcionais', 'read'),
    ('educacao', 'afastamentos', 'read'),
    ('educacao', 'afastamentos', 'ler_devolutiva'),
    ('educacao', 'indicadores', 'read'),

    ('cas', 'portal', 'read'),
    ('cas', 'cas', 'read'),
    ('cas', 'cas', 'write'),
    ('cas', 'cas', 'fila'),
    ('cas', 'documentos', 'read'),
    ('cas', 'documentos_ocupacionais', 'read'),
    ('cas', 'afastamentos', 'read'),
    ('cas', 'afastamentos', 'analisar'),
    ('cas', 'afastamentos', 'solicitar_complementacao'),
    ('cas', 'afastamentos', 'encaminhar_avaliacao'),

    ('medico', 'portal', 'read'),
    ('medico', 'documentos_ocupacionais', 'read'),
    ('medico', 'prontuario_ocupacional', 'read'),
    ('medico', 'prontuario_ocupacional', 'write'),
    ('medico', 'afastamentos', 'read'),
    ('medico', 'afastamentos', 'analisar'),
    ('medico', 'afastamentos', 'emitir_devolutiva'),
    ('medico', 'afastamentos', 'devolutiva'),

    ('enfermeiro', 'portal', 'read'),
    ('enfermeiro', 'documentos_ocupacionais', 'read'),
    ('enfermeiro', 'prontuario_ocupacional', 'read'),
    ('enfermeiro', 'afastamentos', 'read'),

    ('rh', 'portal', 'read'),
    ('rh', 'rh', 'fila'),
    ('rh', 'servidores', 'read'),
    ('rh', 'servidores', 'write'),
    ('rh', 'documentos_administrativos', 'read'),
    ('rh', 'documentos_funcionais', 'read'),
    ('rh', 'afastamentos', 'read'),
    ('rh', 'afastamentos', 'ler_devolutiva'),
    ('rh', 'afastamentos', 'registrar_providencia'),
    ('rh', 'afastamentos', 'concluir'),

    ('servidor', 'portal', 'read')
)
insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from role_permissions rp
join public.perfis p on p.nome = rp.role_name
join public.permissoes pe on pe.recurso = rp.recurso and pe.acao = rp.acao
on conflict (perfil_id, permissao_id) do nothing;

alter table public.setores enable row level security;
alter table public.usuario_setores enable row level security;

drop policy if exists "setores_select_authenticated" on public.setores;
create policy "setores_select_authenticated"
on public.setores for select
to authenticated
using (true);

drop policy if exists "setores_admin_all" on public.setores;
create policy "setores_admin_all"
on public.setores for all
to authenticated
using (public.current_user_has_permission('setores:manage'))
with check (public.current_user_has_permission('setores:manage'));

drop policy if exists "usuario_setores_select_self_or_admin" on public.usuario_setores;
create policy "usuario_setores_select_self_or_admin"
on public.usuario_setores for select
to authenticated
using (usuario_id = auth.uid() or public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuario_setores_admin_all" on public.usuario_setores;
create policy "usuario_setores_admin_all"
on public.usuario_setores for all
to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuarios_select_self_or_admin" on public.usuarios;
create policy "usuarios_select_self_or_admin"
on public.usuarios for select
to authenticated
using (id = auth.uid() or public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuario_perfis_select_self_or_admin" on public.usuario_perfis;
create policy "usuario_perfis_select_self_or_admin"
on public.usuario_perfis for select
to authenticated
using (usuario_id = auth.uid() or public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuario_unidades_select_self_or_admin" on public.usuario_unidades;
create policy "usuario_unidades_select_self_or_admin"
on public.usuario_unidades for select
to authenticated
using (usuario_id = auth.uid() or public.current_user_has_permission('usuarios:manage'));

drop policy if exists "unidades_admin_all" on public.unidades;
create policy "unidades_admin_all"
on public.unidades for all
to authenticated
using (public.current_user_has_permission('unidades:manage'))
with check (public.current_user_has_permission('unidades:manage'));

drop policy if exists "usuarios_update_self_or_admin" on public.usuarios;
create policy "usuarios_update_self_or_admin"
on public.usuarios for update
to authenticated
using (id = auth.uid() or public.current_user_has_permission('usuarios:manage'))
with check (id = auth.uid() or public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuarios_admin_all" on public.usuarios;
create policy "usuarios_admin_all"
on public.usuarios for all
to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "perfis_admin_all" on public.perfis;
create policy "perfis_admin_all"
on public.perfis for all
to authenticated
using (public.current_user_has_permission('perfis:manage'))
with check (public.current_user_has_permission('perfis:manage'));

drop policy if exists "permissoes_admin_all" on public.permissoes;
create policy "permissoes_admin_all"
on public.permissoes for all
to authenticated
using (public.current_user_has_permission('permissoes:manage'))
with check (public.current_user_has_permission('permissoes:manage'));

drop policy if exists "usuario_perfis_admin_all" on public.usuario_perfis;
create policy "usuario_perfis_admin_all"
on public.usuario_perfis for all
to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "usuario_unidades_admin_all" on public.usuario_unidades;
create policy "usuario_unidades_admin_all"
on public.usuario_unidades for all
to authenticated
using (public.current_user_has_permission('usuarios:manage'))
with check (public.current_user_has_permission('usuarios:manage'));

drop policy if exists "perfil_permissoes_admin_all" on public.perfil_permissoes;
create policy "perfil_permissoes_admin_all"
on public.perfil_permissoes for all
to authenticated
using (public.current_user_has_permission('permissoes:manage'))
with check (public.current_user_has_permission('permissoes:manage'));

grant select on public.setores to authenticated;
grant select on public.usuario_setores to authenticated;
grant insert, update, delete on public.setores to authenticated;
grant insert, update, delete on public.usuario_setores to authenticated;

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
    ),
    'setores',
    coalesce(
      (
        select jsonb_agg(distinct us.setor_id order by us.setor_id)
        from public.usuario_setores us
        join public.setores s on s.id = us.setor_id
        where us.usuario_id = user_id
          and s.ativo
      ),
      '[]'::jsonb
    )
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
    public.user_authz_payload(auth.uid()) -> 'unidades',
    'setores',
    public.user_authz_payload(auth.uid()) -> 'setores'
  );
$$;

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

drop trigger if exists on_usuario_setores_changed on public.usuario_setores;
create trigger on_usuario_setores_changed
after insert or update or delete on public.usuario_setores
for each row execute function public.handle_authz_changed();

do $$
declare
  user_record record;
begin
  for user_record in select id from public.usuarios loop
    perform public.sync_user_auth_claims(user_record.id);
  end loop;
end;
$$;
