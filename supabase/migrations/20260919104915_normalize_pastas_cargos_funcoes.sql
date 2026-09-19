-- Estrutura administrativa: uma pasta agrega unidades, e cada unidade agrega setores.
create table organizacional.pastas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  sigla text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pastas_codigo_check check (codigo ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint pastas_nome_check check (btrim(nome) <> ''),
  constraint pastas_sigla_check check (sigla is null or btrim(sigla) <> '')
);

insert into organizacional.pastas (codigo, nome, sigla)
values
  ('educacao', 'Secretaria Municipal de Educação', 'SME'),
  ('administracao', 'Administração Municipal', 'ADM');

alter table organizacional.unidades
  add column pasta_id uuid references organizacional.pastas(id) on delete restrict;

update organizacional.unidades u
set pasta_id = p.id
from organizacional.pastas p
join organizacional.tipos_unidade tu on tu.codigo in ('escola', 'secretaria')
where tu.id = u.tipo_unidade_id
  and p.codigo = 'educacao';

update organizacional.unidades u
set pasta_id = p.id
from organizacional.pastas p
where u.pasta_id is null
  and p.codigo = 'administracao';

alter table organizacional.unidades
  alter column pasta_id set not null,
  add constraint unidades_pasta_id_nome_key unique (pasta_id, nome);

create index unidades_pasta_id_idx on organizacional.unidades (pasta_id);

create trigger set_pastas_updated_at
before update on organizacional.pastas
for each row execute function public.set_updated_at();

-- O cargo pertence ao vínculo jurídico identificado pela matrícula.
alter table servidores.vinculos_funcionais
  add column cargo_id uuid references servidores.cargos(id) on delete restrict;

update servidores.vinculos_funcionais vf
set cargo_id = (
  select lf.cargo_id
  from servidores.lotacoes_funcionais lf
  where lf.vinculo_funcional_id = vf.id
    and lf.cargo_id is not null
  order by lf.principal desc, lf.ativo desc, lf.data_inicio desc nulls last, lf.created_at desc
  limit 1
);

alter table servidores.vinculos_funcionais
  alter column cargo_id set not null;

create index vinculos_funcionais_cargo_id_idx
on servidores.vinculos_funcionais (cargo_id);

-- A função exercida é temporal e não altera o cargo efetivo do vínculo.
create table servidores.funcoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint funcoes_codigo_check check (codigo ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint funcoes_nome_check check (btrim(nome) <> '')
);

insert into servidores.funcoes (codigo, nome, descricao)
values ('administrativo', 'Administrativo', 'Exercício temporário de atividades administrativas.');

create table servidores.exercicios_funcionais (
  id uuid primary key default gen_random_uuid(),
  lotacao_funcional_id uuid not null
    references servidores.lotacoes_funcionais(id) on delete cascade,
  funcao_id uuid not null references servidores.funcoes(id) on delete restrict,
  data_inicio date not null,
  data_fim date,
  motivo text,
  ato_designacao text,
  carga_horaria_semanal numeric(5,2),
  principal boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercicios_funcionais_periodo_check
    check (data_fim is null or data_fim >= data_inicio),
  constraint exercicios_funcionais_carga_horaria_check
    check (carga_horaria_semanal is null or carga_horaria_semanal > 0)
);

create unique index exercicios_funcionais_principal_ativo_idx
on servidores.exercicios_funcionais (lotacao_funcional_id)
where principal and ativo;

create index exercicios_funcionais_lotacao_id_idx
on servidores.exercicios_funcionais (lotacao_funcional_id);

create index exercicios_funcionais_funcao_id_idx
on servidores.exercicios_funcionais (funcao_id);

create trigger set_funcoes_updated_at
before update on servidores.funcoes
for each row execute function public.set_updated_at();

create trigger set_exercicios_funcionais_updated_at
before update on servidores.exercicios_funcionais
for each row execute function public.set_updated_at();

create function servidores.validar_periodo_exercicio_funcional()
returns trigger
language plpgsql
set search_path = servidores, public
as $$
declare
  lotacao servidores.lotacoes_funcionais%rowtype;
begin
  select * into lotacao
  from servidores.lotacoes_funcionais
  where id = new.lotacao_funcional_id;

  if lotacao.id is null then
    raise exception 'Lotação funcional não encontrada';
  end if;

  if lotacao.data_inicio is not null and new.data_inicio < lotacao.data_inicio then
    raise exception 'O exercício da função não pode iniciar antes da lotação';
  end if;

  if lotacao.data_fim is not null
    and (new.data_fim is null or new.data_fim > lotacao.data_fim) then
    raise exception 'O exercício da função não pode terminar depois da lotação';
  end if;

  return new;
end;
$$;

create trigger validar_periodo_exercicio_funcional
before insert or update of lotacao_funcional_id, data_inicio, data_fim
on servidores.exercicios_funcionais
for each row execute function servidores.validar_periodo_exercicio_funcional();

-- O escopo considera todas as matrículas e lotações ativas do servidor.
create or replace function public.current_user_can_access_servidor(target_servidor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = servidores, app_auth, public, auth
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from servidores.servidores s
      where s.id = target_servidor_id
        and s.ativo
        and (
          public.current_user_has_permission('servidores:read')
          or (
            public.current_user_has_permission('afastamentos:create')
            and exists (
              select 1
              from servidores.vinculos_funcionais vf
              join servidores.lotacoes_funcionais lf
                on lf.vinculo_funcional_id = vf.id
              where vf.servidor_id = s.id
                and vf.ativo
                and lf.ativo
                and public.current_user_has_unidade(lf.unidade_id)
            )
          )
        )
    );
$$;

drop function public.list_servidores_for_afastamentos(uuid[]);

create function public.list_servidores_for_afastamentos(
  allowed_unidades uuid[] default null
)
returns table (
  id uuid,
  vinculo_id uuid,
  nome text,
  matricula text,
  cpf text,
  cargo text,
  unidade_id uuid,
  unidade_nome text,
  funcao text,
  ativo boolean
)
language sql
stable
security definer
set search_path = servidores, organizacional, public, auth
as $$
  select
    s.id,
    vf.id,
    p.nome_completo,
    vf.matricula,
    p.cpf,
    c.nome,
    lf.unidade_id,
    u.nome,
    f.nome,
    s.ativo and vf.ativo and lf.ativo
  from servidores.servidores s
  join servidores.pessoas p on p.id = s.pessoa_id
  join servidores.vinculos_funcionais vf
    on vf.servidor_id = s.id and vf.ativo
  join servidores.lotacoes_funcionais lf
    on lf.vinculo_funcional_id = vf.id and lf.ativo and lf.principal
  join organizacional.unidades u on u.id = lf.unidade_id
  join servidores.cargos c on c.id = vf.cargo_id
  left join servidores.exercicios_funcionais ef
    on ef.lotacao_funcional_id = lf.id and ef.ativo and ef.principal
  left join servidores.funcoes f on f.id = ef.funcao_id
  where (select auth.uid()) is not null
    and public.current_user_can_access_servidor(s.id)
    and (allowed_unidades is null or lf.unidade_id = any(allowed_unidades))
  order by p.nome_completo, vf.matricula;
$$;

drop function public.get_servidores_resumo_for_afastamentos(uuid[]);

create function public.get_servidores_resumo_for_afastamentos(servidor_ids uuid[])
returns table (
  id uuid,
  vinculo_id uuid,
  nome text,
  matricula text,
  cpf text,
  cargo text,
  unidade_id uuid,
  unidade_nome text,
  funcao text,
  ativo boolean
)
language sql
stable
security definer
set search_path = servidores, afastamentos, organizacional, public, auth
as $$
  select distinct
    s.id,
    vf.id,
    p.nome_completo,
    vf.matricula,
    p.cpf,
    c.nome,
    lf.unidade_id,
    u.nome,
    f.nome,
    s.ativo and vf.ativo and lf.ativo
  from servidores.servidores s
  join servidores.pessoas p on p.id = s.pessoa_id
  join servidores.vinculos_funcionais vf
    on vf.servidor_id = s.id and vf.ativo and vf.principal
  join servidores.lotacoes_funcionais lf
    on lf.vinculo_funcional_id = vf.id and lf.ativo and lf.principal
  join organizacional.unidades u on u.id = lf.unidade_id
  join servidores.cargos c on c.id = vf.cargo_id
  left join servidores.exercicios_funcionais ef
    on ef.lotacao_funcional_id = lf.id and ef.ativo and ef.principal
  left join servidores.funcoes f on f.id = ef.funcao_id
  left join afastamentos.afastamentos a on a.servidor_id = s.id
  where (select auth.uid()) is not null
    and s.id = any(servidor_ids)
    and (
      public.current_user_can_access_servidor(s.id)
      or public.current_user_can_access_afastamento(a.id)
    );
$$;

drop index servidores.lotacoes_funcionais_cargo_id_idx;
alter table servidores.lotacoes_funcionais drop column cargo_id;

alter table organizacional.pastas enable row level security;
alter table servidores.funcoes enable row level security;
alter table servidores.exercicios_funcionais enable row level security;

create policy "pastas_select" on organizacional.pastas
for select to authenticated using (true);
create policy "pastas_insert" on organizacional.pastas
for insert to authenticated with check (public.current_user_has_permission('unidades:manage'));
create policy "pastas_update" on organizacional.pastas
for update to authenticated
using (public.current_user_has_permission('unidades:manage'))
with check (public.current_user_has_permission('unidades:manage'));
create policy "pastas_delete" on organizacional.pastas
for delete to authenticated using (public.current_user_has_permission('unidades:manage'));

create policy "funcoes_select" on servidores.funcoes
for select to authenticated using (true);
create policy "funcoes_insert" on servidores.funcoes
for insert to authenticated with check (public.current_user_has_permission('servidores:write'));
create policy "funcoes_update" on servidores.funcoes
for update to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));
create policy "funcoes_delete" on servidores.funcoes
for delete to authenticated using (public.current_user_has_permission('servidores:delete'));

create policy "exercicios_funcionais_select" on servidores.exercicios_funcionais
for select to authenticated
using (
  exists (
    select 1
    from servidores.lotacoes_funcionais lf
    join servidores.vinculos_funcionais vf on vf.id = lf.vinculo_funcional_id
    where lf.id = exercicios_funcionais.lotacao_funcional_id
      and public.current_user_can_access_servidor(vf.servidor_id)
  )
);
create policy "exercicios_funcionais_insert" on servidores.exercicios_funcionais
for insert to authenticated with check (public.current_user_has_permission('servidores:write'));
create policy "exercicios_funcionais_update" on servidores.exercicios_funcionais
for update to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));
create policy "exercicios_funcionais_delete" on servidores.exercicios_funcionais
for delete to authenticated using (public.current_user_has_permission('servidores:delete'));

grant select, insert, update, delete on organizacional.pastas to authenticated;
grant select, insert, update, delete on servidores.funcoes to authenticated;
grant select, insert, update, delete on servidores.exercicios_funcionais to authenticated;

revoke all on function public.list_servidores_for_afastamentos(uuid[]) from public, anon;
revoke all on function public.get_servidores_resumo_for_afastamentos(uuid[]) from public, anon;
grant execute on function public.list_servidores_for_afastamentos(uuid[]) to authenticated;
grant execute on function public.get_servidores_resumo_for_afastamentos(uuid[]) to authenticated;

revoke all on function servidores.validar_periodo_exercicio_funcional()
from public, anon, authenticated;

comment on table organizacional.pastas is
  'Órgãos superiores que agrupam unidades administrativas, como secretarias municipais.';
comment on table organizacional.unidades is
  'Locais organizacionais pertencentes a uma pasta, como sede, escola, departamento ou CAS.';
comment on table servidores.vinculos_funcionais is
  'Relação jurídica individual, identificada por matrícula, regime e cargo efetivo.';
comment on table servidores.lotacoes_funcionais is
  'Histórico dos locais de trabalho de cada vínculo, com unidade e setor opcionais.';
comment on table servidores.funcoes is
  'Catálogo de funções exercidas sem alteração do cargo efetivo.';
comment on table servidores.exercicios_funcionais is
  'Histórico da função efetivamente exercida pelo servidor em uma lotação.';
