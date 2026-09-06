create table if not exists public.servidores (
  id uuid primary key default gen_random_uuid(),
  matricula text not null unique,
  nome text not null,
  cpf text unique,
  cargo text,
  data_admissao date,
  unidade_id uuid not null references public.unidades(id) on delete restrict,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prontuarios (
  id uuid primary key default gen_random_uuid(),
  servidor_id uuid not null unique references public.servidores(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.afastamentos (
  id uuid primary key default gen_random_uuid(),
  servidor_id uuid not null references public.servidores(id) on delete restrict,
  prontuario_id uuid references public.prontuarios(id) on delete restrict,
  iniciado_por uuid not null references public.usuarios(id) on delete restrict default auth.uid(),
  status text not null default 'rascunho',
  protocolo text unique,
  iniciado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint afastamentos_status_check check (status in (
    'rascunho',
    'registrado',
    'encaminhado',
    'aguardando_analise',
    'em_analise',
    'aguardando_complementacao',
    'aguardando_avaliacao',
    'avaliado',
    'aguardando_rh',
    'concluido'
  ))
);

create index if not exists idx_servidores_unidade on public.servidores(unidade_id);
create index if not exists idx_servidores_nome on public.servidores(nome);
create index if not exists idx_afastamentos_servidor on public.afastamentos(servidor_id);
create index if not exists idx_afastamentos_status on public.afastamentos(status);
create index if not exists idx_afastamentos_iniciado_por on public.afastamentos(iniciado_por);

drop trigger if exists set_servidores_updated_at on public.servidores;
create trigger set_servidores_updated_at
before update on public.servidores
for each row execute function public.set_updated_at();

drop trigger if exists set_prontuarios_updated_at on public.prontuarios;
create trigger set_prontuarios_updated_at
before update on public.prontuarios
for each row execute function public.set_updated_at();

drop trigger if exists set_afastamentos_updated_at on public.afastamentos;
create trigger set_afastamentos_updated_at
before update on public.afastamentos
for each row execute function public.set_updated_at();

create or replace function public.current_user_has_unidade(unidade uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuario_unidades uu
    where uu.usuario_id = auth.uid()
      and uu.unidade_id = unidade
  );
$$;

create or replace function public.current_user_is_gestor_escolar()
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
      and p.nome = 'gestor_escolar'
      and p.ativo
  );
$$;

alter table public.servidores enable row level security;
alter table public.prontuarios enable row level security;
alter table public.afastamentos enable row level security;

drop policy if exists "servidores_select_by_permission_scope" on public.servidores;
create policy "servidores_select_by_permission_scope"
on public.servidores for select
to authenticated
using (
  public.current_user_has_permission('servidores:read')
  or (
    public.current_user_has_permission('afastamentos:create')
    and public.current_user_is_gestor_escolar()
    and public.current_user_has_unidade(unidade_id)
  )
);

drop policy if exists "servidores_admin_write" on public.servidores;
create policy "servidores_admin_write"
on public.servidores for all
to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));

drop policy if exists "prontuarios_select_by_servidor_scope" on public.prontuarios;
create policy "prontuarios_select_by_servidor_scope"
on public.prontuarios for select
to authenticated
using (
  public.current_user_has_permission('prontuario:read')
  or exists (
    select 1
    from public.servidores s
    where s.id = prontuarios.servidor_id
      and public.current_user_has_permission('afastamentos:create')
      and public.current_user_is_gestor_escolar()
      and public.current_user_has_unidade(s.unidade_id)
  )
);

drop policy if exists "afastamentos_select_by_permission_scope" on public.afastamentos;
create policy "afastamentos_select_by_permission_scope"
on public.afastamentos for select
to authenticated
using (
  public.current_user_has_permission('afastamentos:read')
  or (
    public.current_user_has_permission('afastamentos:create')
    and exists (
      select 1
      from public.servidores s
      where s.id = afastamentos.servidor_id
        and public.current_user_has_unidade(s.unidade_id)
    )
  )
);

drop policy if exists "afastamentos_insert_by_servidor_scope" on public.afastamentos;
create policy "afastamentos_insert_by_servidor_scope"
on public.afastamentos for insert
to authenticated
with check (
  public.current_user_has_permission('afastamentos:create')
  and iniciado_por = auth.uid()
  and exists (
    select 1
    from public.servidores s
    where s.id = afastamentos.servidor_id
      and (
        not public.current_user_is_gestor_escolar()
        or public.current_user_has_unidade(s.unidade_id)
      )
  )
);

grant select on public.servidores to authenticated;
grant select on public.prontuarios to authenticated;
grant select, insert on public.afastamentos to authenticated;
grant execute on function public.current_user_has_unidade(uuid) to authenticated;
grant execute on function public.current_user_is_gestor_escolar() to authenticated;
