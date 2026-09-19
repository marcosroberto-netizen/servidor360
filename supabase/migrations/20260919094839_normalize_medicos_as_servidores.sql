create table servidores.vinculos_funcionais (
  id uuid primary key default gen_random_uuid(),
  servidor_id uuid not null references servidores.servidores(id) on delete cascade,
  matricula text not null,
  tipo_vinculo text not null default 'nao_informado',
  cargo text,
  unidade_id uuid not null references organizacional.unidades(id) on delete restrict,
  data_inicio date,
  data_fim date,
  numero_instrumento text,
  carga_horaria_semanal numeric(5,2),
  principal boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vinculos_funcionais_matricula_check
    check (btrim(matricula) <> ''),
  constraint vinculos_funcionais_tipo_check
    check (tipo_vinculo in (
      'estatutario',
      'celetista',
      'temporario',
      'comissionado',
      'outro',
      'nao_informado'
    )),
  constraint vinculos_funcionais_periodo_check
    check (data_fim is null or data_inicio is null or data_fim >= data_inicio),
  constraint vinculos_funcionais_carga_horaria_check
    check (carga_horaria_semanal is null or carga_horaria_semanal > 0),
  unique (servidor_id, matricula)
);

insert into servidores.vinculos_funcionais (
  servidor_id,
  matricula,
  tipo_vinculo,
  cargo,
  unidade_id,
  data_inicio,
  principal,
  ativo
)
select
  s.id,
  s.matricula,
  'nao_informado',
  s.cargo,
  s.unidade_id,
  s.data_admissao,
  true,
  s.ativo
from servidores.servidores s;

create unique index vinculos_funcionais_matricula_ativa_idx
on servidores.vinculos_funcionais (matricula)
where ativo;

create unique index vinculos_funcionais_principal_ativo_idx
on servidores.vinculos_funcionais (servidor_id)
where principal and ativo;

create index vinculos_funcionais_servidor_id_idx
on servidores.vinculos_funcionais (servidor_id);

create index vinculos_funcionais_unidade_id_idx
on servidores.vinculos_funcionais (unidade_id);

create index vinculos_funcionais_tipo_ativo_idx
on servidores.vinculos_funcionais (tipo_vinculo)
where ativo;

create trigger set_vinculos_funcionais_updated_at
before update on servidores.vinculos_funcionais
for each row execute function public.set_updated_at();

alter table servidores.vinculos_funcionais enable row level security;

create policy "vinculos_funcionais_select"
on servidores.vinculos_funcionais for select
to authenticated
using (
  public.current_user_has_permission('servidores:read')
  or public.current_user_has_permission('medicos:read')
  or (
    public.current_user_has_permission('afastamentos:create')
    and public.current_user_has_unidade(unidade_id)
  )
);

create policy "vinculos_funcionais_insert"
on servidores.vinculos_funcionais for insert
to authenticated
with check (public.current_user_has_permission('servidores:write'));

create policy "vinculos_funcionais_update"
on servidores.vinculos_funcionais for update
to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));

create policy "vinculos_funcionais_delete"
on servidores.vinculos_funcionais for delete
to authenticated
using (public.current_user_has_permission('servidores:write'));

grant select, insert, update, delete
on servidores.vinculos_funcionais
to authenticated;

do $$
begin
  if exists (select 1 from medicos.medicos where contratado_id is not null)
    or exists (select 1 from medicos.contratados)
    or exists (select 1 from medicos.contratos_temporarios)
  then
    raise exception 'Existem dados de médicos contratados que precisam ser migrados manualmente';
  end if;
end
$$;

alter table medicos.medicos
  drop constraint medicos_origem_check,
  drop column contratado_id,
  alter column servidor_id set not null;

drop table medicos.contratos_temporarios;
drop table medicos.contratados;

comment on table servidores.vinculos_funcionais is
  'Histórico dos vínculos do servidor com o município, incluindo regime, lotação e vigência.';

comment on column servidores.vinculos_funcionais.tipo_vinculo is
  'Regime do vínculo: estatutário, celetista, temporário, comissionado, outro ou não informado.';

comment on table medicos.medicos is
  'Habilitação médica de um servidor municipal, independentemente do regime do vínculo funcional.';
