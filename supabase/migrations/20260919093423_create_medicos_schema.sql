create schema if not exists medicos;

create table medicos.contratados (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  cpf text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contratados_nome_check
    check (btrim(nome_completo) <> ''),
  constraint contratados_cpf_check
    check (cpf ~ '^[0-9]{11}$')
);

create table medicos.contratos_temporarios (
  id uuid primary key default gen_random_uuid(),
  contratado_id uuid not null references medicos.contratados(id) on delete restrict,
  numero_contrato text not null unique,
  data_inicio date not null,
  data_fim date not null,
  contratado_por text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contratos_temporarios_numero_check
    check (btrim(numero_contrato) <> ''),
  constraint contratos_temporarios_periodo_check
    check (data_fim >= data_inicio)
);

create table medicos.medicos (
  id uuid primary key default gen_random_uuid(),
  servidor_id uuid unique references servidores.servidores(id) on delete restrict,
  contratado_id uuid unique references medicos.contratados(id) on delete restrict,
  usuario_id uuid unique references app_auth.usuarios(id) on delete set null,
  disponivel_para_agendamento boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicos_origem_check
    check (num_nonnulls(servidor_id, contratado_id) = 1)
);

create table medicos.registros_profissionais (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid not null references medicos.medicos(id) on delete cascade,
  conselho text not null default 'CRM',
  numero text not null,
  uf text not null,
  principal boolean not null default false,
  ativo boolean not null default true,
  data_validade date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registros_profissionais_conselho_check
    check (btrim(conselho) <> ''),
  constraint registros_profissionais_numero_check
    check (btrim(numero) <> ''),
  constraint registros_profissionais_uf_check
    check (uf ~ '^[A-Z]{2}$'),
  unique (conselho, uf, numero)
);

create table medicos.especialidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint especialidades_nome_check
    check (btrim(nome) <> '')
);

create table medicos.medico_especialidades (
  medico_id uuid not null references medicos.medicos(id) on delete cascade,
  especialidade_id uuid not null references medicos.especialidades(id) on delete restrict,
  rqe text,
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (medico_id, especialidade_id),
  constraint medico_especialidades_rqe_check
    check (rqe is null or btrim(rqe) <> '')
);

create table medicos.medico_unidades (
  medico_id uuid not null references medicos.medicos(id) on delete cascade,
  unidade_id uuid not null references organizacional.unidades(id) on delete restrict,
  principal boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (medico_id, unidade_id)
);

create unique index registros_profissionais_principal_medico_idx
on medicos.registros_profissionais (medico_id)
where principal and ativo;

create unique index medico_especialidades_principal_medico_idx
on medicos.medico_especialidades (medico_id)
where principal;

create unique index medico_unidades_principal_medico_idx
on medicos.medico_unidades (medico_id)
where principal and ativo;

create index registros_profissionais_medico_id_idx
on medicos.registros_profissionais (medico_id);

create index contratos_temporarios_contratado_id_idx
on medicos.contratos_temporarios (contratado_id, data_fim desc);

create index medico_especialidades_especialidade_id_idx
on medicos.medico_especialidades (especialidade_id);

create index medico_unidades_unidade_id_idx
on medicos.medico_unidades (unidade_id);

create index medicos_disponiveis_idx
on medicos.medicos (id)
where ativo and disponivel_para_agendamento;

drop trigger if exists set_contratados_updated_at on medicos.contratados;
create trigger set_contratados_updated_at
before update on medicos.contratados
for each row execute function public.set_updated_at();

drop trigger if exists set_contratos_temporarios_updated_at on medicos.contratos_temporarios;
create trigger set_contratos_temporarios_updated_at
before update on medicos.contratos_temporarios
for each row execute function public.set_updated_at();

drop trigger if exists set_medicos_updated_at on medicos.medicos;
create trigger set_medicos_updated_at
before update on medicos.medicos
for each row execute function public.set_updated_at();

drop trigger if exists set_registros_profissionais_updated_at on medicos.registros_profissionais;
create trigger set_registros_profissionais_updated_at
before update on medicos.registros_profissionais
for each row execute function public.set_updated_at();

drop trigger if exists set_especialidades_updated_at on medicos.especialidades;
create trigger set_especialidades_updated_at
before update on medicos.especialidades
for each row execute function public.set_updated_at();

insert into app_auth.permissoes (nome, recurso, acao)
values
  ('Consultar médicos', 'medicos', 'read'),
  ('Gerenciar médicos', 'medicos', 'manage')
on conflict (recurso, acao) do update
set nome = excluded.nome;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
cross join app_auth.permissoes pe
where p.nome in ('cas', 'medico', 'rh')
  and pe.recurso = 'medicos'
  and pe.acao = 'read'
on conflict (perfil_id, permissao_id) do nothing;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
cross join app_auth.permissoes pe
where p.nome = 'rh'
  and pe.recurso = 'medicos'
  and pe.acao = 'manage'
on conflict (perfil_id, permissao_id) do nothing;

alter table medicos.contratados enable row level security;
alter table medicos.contratos_temporarios enable row level security;
alter table medicos.medicos enable row level security;
alter table medicos.registros_profissionais enable row level security;
alter table medicos.especialidades enable row level security;
alter table medicos.medico_especialidades enable row level security;
alter table medicos.medico_unidades enable row level security;

create policy "contratados_manage"
on medicos.contratados for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

create policy "contratos_temporarios_manage"
on medicos.contratos_temporarios for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

create policy "medicos_select"
on medicos.medicos for select
to authenticated
using (public.current_user_has_permission('medicos:read'));

create policy "medicos_manage"
on medicos.medicos for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

create policy "registros_profissionais_select"
on medicos.registros_profissionais for select
to authenticated
using (public.current_user_has_permission('medicos:read'));

create policy "registros_profissionais_manage"
on medicos.registros_profissionais for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

create policy "especialidades_select"
on medicos.especialidades for select
to authenticated
using (public.current_user_has_permission('medicos:read'));

create policy "especialidades_manage"
on medicos.especialidades for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

create policy "medico_especialidades_select"
on medicos.medico_especialidades for select
to authenticated
using (public.current_user_has_permission('medicos:read'));

create policy "medico_especialidades_manage"
on medicos.medico_especialidades for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

create policy "medico_unidades_select"
on medicos.medico_unidades for select
to authenticated
using (public.current_user_has_permission('medicos:read'));

create policy "medico_unidades_manage"
on medicos.medico_unidades for all
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));

grant usage on schema medicos to authenticated;

grant select, insert, update, delete on medicos.contratados to authenticated;
grant select, insert, update, delete on medicos.contratos_temporarios to authenticated;
grant select, insert, update, delete on medicos.medicos to authenticated;
grant select, insert, update, delete on medicos.registros_profissionais to authenticated;
grant select, insert, update, delete on medicos.especialidades to authenticated;
grant select, insert, update, delete on medicos.medico_especialidades to authenticated;
grant select, insert, update, delete on medicos.medico_unidades to authenticated;

comment on schema medicos is
  'Cadastro de médicos, vínculos, habilitações e locais de atuação.';

comment on table medicos.medicos is
  'Identidade profissional do médico, vinculada exclusivamente a um servidor ou contrato temporário.';

comment on column medicos.medicos.disponivel_para_agendamento is
  'Indica se o médico participa da distribuição de novas avaliações; a carga é calculada pelas avaliações ativas.';
