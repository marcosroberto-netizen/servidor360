alter table afastamentos.afastamentos
  add column vinculo_funcional_id uuid
    references servidores.vinculos_funcionais(id) on delete restrict;

update afastamentos.afastamentos a
set vinculo_funcional_id = (
  select vf.id
  from servidores.vinculos_funcionais vf
  where vf.servidor_id = a.servidor_id
  order by vf.principal desc, vf.ativo desc, vf.data_inicio desc nulls last, vf.created_at desc
  limit 1
);

alter table afastamentos.afastamentos
  alter column vinculo_funcional_id set not null;

create index afastamentos_vinculo_funcional_id_idx
on afastamentos.afastamentos (vinculo_funcional_id);

create or replace function public.current_user_can_access_afastamento(afastamento_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = afastamentos, servidores, public, auth
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from afastamentos.afastamentos a
      where a.id = afastamento_uuid
        and (
          public.current_user_has_permission('afastamentos:read')
          or (
            public.current_user_has_permission('afastamentos:create')
            and exists (
              select 1
              from servidores.lotacoes_funcionais lf
              where lf.vinculo_funcional_id = a.vinculo_funcional_id
                and lf.ativo
                and public.current_user_has_unidade(lf.unidade_id)
            )
          )
        )
    );
$$;

create or replace function public.criar_afastamento(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = afastamentos, servidores, public, auth
as $$
declare
  target_servidor_id uuid;
  target_vinculo_id uuid;
  created_id uuid;
  generated_protocolo text;
begin
  if not public.current_user_has_permission('afastamentos:create') then
    raise exception 'Usuario sem permissao para criar afastamento';
  end if;

  target_servidor_id := nullif(input ->> 'servidorId', '')::uuid;
  target_vinculo_id := nullif(input ->> 'vinculoId', '')::uuid;

  if target_servidor_id is null or not public.current_user_can_access_servidor(target_servidor_id) then
    raise exception 'Servidor nao encontrado ou fora do escopo permitido';
  end if;

  if target_vinculo_id is null or not exists (
    select 1
    from servidores.vinculos_funcionais vf
    join servidores.lotacoes_funcionais lf
      on lf.vinculo_funcional_id = vf.id
    where vf.id = target_vinculo_id
      and vf.servidor_id = target_servidor_id
      and vf.ativo
      and lf.ativo
      and public.current_user_has_unidade(lf.unidade_id)
  ) then
    raise exception 'Vinculo funcional nao encontrado ou fora do escopo permitido';
  end if;

  if nullif(input ->> 'tipo', '') is null then
    raise exception 'Tipo do afastamento obrigatorio';
  end if;
  if nullif(input ->> 'dataInicio', '') is null or nullif(input ->> 'dataFim', '') is null then
    raise exception 'Periodo do afastamento obrigatorio';
  end if;
  if nullif(input ->> 'motivo', '') is null then
    raise exception 'Motivo obrigatorio';
  end if;

  insert into servidores.prontuarios (servidor_id)
  values (target_servidor_id)
  on conflict (servidor_id) do update set updated_at = now();

  generated_protocolo := afastamentos.next_protocolo();

  insert into afastamentos.afastamentos (
    servidor_id, vinculo_funcional_id, iniciado_por, status, protocolo, tipo,
    data_inicio, data_fim, motivo, observacoes, documento_origem_nome,
    documento_origem_url, documento_origem_tipo
  )
  values (
    target_servidor_id, target_vinculo_id, (select auth.uid()),
    'aguardando_analise', generated_protocolo, nullif(input ->> 'tipo', ''),
    nullif(input ->> 'dataInicio', '')::date, nullif(input ->> 'dataFim', '')::date,
    nullif(input ->> 'motivo', ''), nullif(input ->> 'observacoes', ''),
    nullif(input ->> 'documentoNome', ''), nullif(input ->> 'documentoUrl', ''),
    nullif(input ->> 'documentoTipo', '')
  )
  returning id into created_id;

  perform afastamentos.add_movimentacao(
    created_id, 'criacao', 'Afastamento registrado',
    'Processo criado e encaminhado ao CAS.', null, 'aguardando_analise', 'publica'
  );
  return created_id;
end;
$$;

create function public.get_vinculos_resumo_for_afastamentos(vinculo_ids uuid[])
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
  from servidores.vinculos_funcionais vf
  join servidores.servidores s on s.id = vf.servidor_id
  join servidores.pessoas p on p.id = s.pessoa_id
  join servidores.lotacoes_funcionais lf
    on lf.vinculo_funcional_id = vf.id and lf.ativo and lf.principal
  join organizacional.unidades u on u.id = lf.unidade_id
  join servidores.cargos c on c.id = vf.cargo_id
  left join servidores.exercicios_funcionais ef
    on ef.lotacao_funcional_id = lf.id and ef.ativo and ef.principal
  left join servidores.funcoes f on f.id = ef.funcao_id
  left join afastamentos.afastamentos a on a.vinculo_funcional_id = vf.id
  where (select auth.uid()) is not null
    and vf.id = any(vinculo_ids)
    and (
      public.current_user_can_access_servidor(s.id)
      or public.current_user_can_access_afastamento(a.id)
    );
$$;

revoke all on function public.get_vinculos_resumo_for_afastamentos(uuid[])
from public, anon;
grant execute on function public.get_vinculos_resumo_for_afastamentos(uuid[])
to authenticated;

comment on column afastamentos.afastamentos.vinculo_funcional_id is
  'Matrícula e vínculo funcional aos quais o afastamento se aplica.';
