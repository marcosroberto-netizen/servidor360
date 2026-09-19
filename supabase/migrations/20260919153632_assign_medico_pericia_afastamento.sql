create table afastamentos.avaliacoes_medicas (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  medico_id uuid not null references medicos.medicos(id) on delete restrict,
  status text not null default 'pendente',
  encaminhado_por uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  encaminhado_em timestamptz not null default now(),
  concluido_em timestamptz,
  constraint avaliacoes_medicas_status_check
    check (status in ('pendente', 'concluida', 'cancelada')),
  constraint avaliacoes_medicas_conclusao_check check (
    (status = 'concluida' and concluido_em is not null)
    or (status <> 'concluida' and concluido_em is null)
  )
);

create unique index avaliacoes_medicas_afastamento_pendente_idx
on afastamentos.avaliacoes_medicas (afastamento_id)
where status = 'pendente';

create index avaliacoes_medicas_medico_fila_idx
on afastamentos.avaliacoes_medicas (medico_id, status, encaminhado_em)
where status = 'pendente';

create index avaliacoes_medicas_encaminhado_por_idx
on afastamentos.avaliacoes_medicas (encaminhado_por)
where encaminhado_por is not null;

alter table afastamentos.avaliacoes_medicas enable row level security;
revoke all on table afastamentos.avaliacoes_medicas from anon, authenticated;
grant select on table afastamentos.avaliacoes_medicas to authenticated;

create policy "avaliacoes_medicas_select_authorized"
on afastamentos.avaliacoes_medicas for select
to authenticated
using (
  public.current_user_has_permission('afastamentos:analisar')
  or public.current_user_has_role('administrador')
  or exists (
    select 1
    from medicos.medicos m
    join servidores.servidores s on s.id = m.servidor_id
    join app_auth.usuarios u on u.pessoa_id = s.pessoa_id
    where m.id = medico_id
      and u.id = (select auth.uid())
  )
);

create or replace function public.list_medicos_para_avaliacao()
returns table (
  medico_id uuid,
  nome text,
  registro_profissional text,
  especialidade text,
  unidade text,
  pacientes_pendentes bigint
)
language plpgsql
stable
security definer
set search_path = medicos, servidores, organizacional, afastamentos, app_auth, public, auth
as $$
begin
  if not public.current_user_has_permission('afastamentos:analisar') then
    raise exception 'Usuario sem permissao para consultar medicos para avaliacao';
  end if;

  return query
  select
    m.id,
    p.nome_completo,
    concat_ws(' ', rp.conselho, rp.numero || '/' || rp.uf),
    esp.nome,
    un.nome,
    count(am.id)::bigint
  from medicos.medicos m
  join servidores.servidores s on s.id = m.servidor_id and s.ativo
  join servidores.pessoas p on p.id = s.pessoa_id and p.ativo
  join app_auth.usuarios usr on usr.pessoa_id = p.id and usr.ativo
  left join lateral (
    select r.conselho, r.numero, r.uf
    from medicos.registros_profissionais r
    where r.medico_id = m.id and r.ativo
    order by r.principal desc, r.created_at
    limit 1
  ) rp on true
  left join lateral (
    select e.nome
    from medicos.medico_especialidades me
    join medicos.especialidades e on e.id = me.especialidade_id and e.ativo
    where me.medico_id = m.id
    order by me.principal desc, e.nome
    limit 1
  ) esp on true
  left join lateral (
    select u.nome
    from medicos.locais_atendimento la
    join organizacional.unidades u on u.id = la.unidade_id and u.ativo
    where la.medico_id = m.id and la.ativo
    order by la.principal desc, u.nome
    limit 1
  ) un on true
  left join afastamentos.avaliacoes_medicas am
    on am.medico_id = m.id and am.status = 'pendente'
  where m.ativo
    and m.disponivel_para_agendamento
    and exists (
      select 1
      from app_auth.usuario_perfis up
      join app_auth.perfis pf on pf.id = up.perfil_id and pf.ativo
      join app_auth.perfil_permissoes pp on pp.perfil_id = pf.id
      join app_auth.permissoes pe on pe.id = pp.permissao_id
      where up.usuario_id = usr.id
        and (
          (pe.recurso = '*' and pe.acao = '*')
          or (pe.recurso = 'afastamentos' and pe.acao = 'emitir_devolutiva')
        )
    )
  group by m.id, p.nome_completo, rp.conselho, rp.numero, rp.uf, esp.nome, un.nome
  order by count(am.id), p.nome_completo;
end;
$$;

alter function public.registrar_triagem_afastamento(uuid, text, text, text, text)
rename to registrar_triagem_afastamento_core;

revoke all on function public.registrar_triagem_afastamento_core(uuid, text, text, text, text)
from public, anon, authenticated;

create function public.registrar_triagem_afastamento(
  target_afastamento_id uuid,
  resultado text,
  encaminhamento text,
  comentarios text,
  complemento text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
begin
  if encaminhamento = 'encaminhar_avaliacao' then
    raise exception 'Selecione um medico para encaminhar a avaliacao';
  end if;

  perform public.registrar_triagem_afastamento_core(
    target_afastamento_id,
    resultado,
    encaminhamento,
    comentarios,
    complemento
  );
end;
$$;

create function public.registrar_triagem_afastamento(
  target_afastamento_id uuid,
  resultado text,
  encaminhamento text,
  comentarios text,
  complemento text,
  target_medico_id uuid
)
returns void
language plpgsql
security definer
set search_path = afastamentos, medicos, servidores, app_auth, public, auth
as $$
declare
  medico_usuario_id uuid;
begin
  if encaminhamento <> 'encaminhar_avaliacao' then
    if target_medico_id is not null then
      raise exception 'Medico so pode ser informado para avaliacao medica/pericial';
    end if;

    perform public.registrar_triagem_afastamento_core(
      target_afastamento_id,
      resultado,
      encaminhamento,
      comentarios,
      complemento
    );
    return;
  end if;

  if target_medico_id is null then
    raise exception 'Selecione um medico para encaminhar a avaliacao';
  end if;

  select usr.id into medico_usuario_id
  from medicos.medicos m
  join servidores.servidores s on s.id = m.servidor_id and s.ativo
  join app_auth.usuarios usr on usr.pessoa_id = s.pessoa_id and usr.ativo
  where m.id = target_medico_id
    and m.ativo
    and m.disponivel_para_agendamento
    and exists (
      select 1
      from app_auth.usuario_perfis up
      join app_auth.perfis pf on pf.id = up.perfil_id and pf.ativo
      join app_auth.perfil_permissoes pp on pp.perfil_id = pf.id
      join app_auth.permissoes pe on pe.id = pp.permissao_id
      where up.usuario_id = usr.id
        and (
          (pe.recurso = '*' and pe.acao = '*')
          or (pe.recurso = 'afastamentos' and pe.acao = 'emitir_devolutiva')
        )
    );

  if medico_usuario_id is null then
    raise exception 'Medico indisponivel ou sem permissao para avaliar afastamentos';
  end if;

  perform public.registrar_triagem_afastamento_core(
    target_afastamento_id,
    resultado,
    encaminhamento,
    comentarios,
    complemento
  );

  update afastamentos.avaliacoes_medicas
  set status = 'cancelada'
  where afastamento_id = target_afastamento_id and status = 'pendente';

  insert into afastamentos.avaliacoes_medicas (
    afastamento_id,
    target_medico_id,
    encaminhado_por
  ) values (
    target_afastamento_id,
    medico_id,
    (select auth.uid())
  );

  delete from afastamentos.notificacoes
  where afastamento_id = target_afastamento_id
    and tipo = 'avaliacao'
    and status = 'pendente';

  insert into afastamentos.notificacoes (
    afastamento_id,
    destinatario_id,
    tipo,
    titulo,
    mensagem,
    criado_por
  ) values (
    target_afastamento_id,
    medico_usuario_id,
    'avaliacao',
    'Nova avaliacao medica/pericial atribuida',
    comentarios,
    (select auth.uid())
  );
end;
$$;

create or replace function public.emitir_devolutiva_afastamento(
  target_afastamento_id uuid,
  resultado text,
  descricao text,
  orientacoes text default null,
  encaminhar_rh boolean default true
)
returns void
language plpgsql
security definer
set search_path = afastamentos, medicos, servidores, app_auth, public, auth
as $$
declare
  current_status text;
  next_status text;
  assigned_medico_id uuid;
begin
  if not public.current_user_has_permission('afastamentos:emitir_devolutiva') then
    raise exception 'Usuario sem permissao para emitir devolutiva';
  end if;

  select status into current_status
  from afastamentos.afastamentos
  where id = target_afastamento_id;

  if current_status is null then
    raise exception 'Afastamento nao encontrado';
  end if;

  select am.medico_id into assigned_medico_id
  from afastamentos.avaliacoes_medicas am
  where am.afastamento_id = target_afastamento_id and am.status = 'pendente';

  if assigned_medico_id is not null
    and not public.current_user_has_role('administrador')
    and not exists (
      select 1
      from medicos.medicos m
      join servidores.servidores s on s.id = m.servidor_id
      join app_auth.usuarios usr on usr.pessoa_id = s.pessoa_id
      where m.id = assigned_medico_id and usr.id = (select auth.uid())
    )
  then
    raise exception 'A avaliacao esta atribuida a outro medico';
  end if;

  next_status := case when encaminhar_rh then 'aguardando_rh' else 'avaliado' end;

  insert into afastamentos.devolutivas (
    afastamento_id,
    resultado,
    descricao,
    orientacoes,
    responsavel_id,
    visibilidade
  ) values (
    target_afastamento_id,
    resultado,
    nullif(descricao, ''),
    nullif(orientacoes, ''),
    (select auth.uid()),
    'restrita'
  );

  update afastamentos.avaliacoes_medicas
  set status = 'concluida', concluido_em = now()
  where afastamento_id = target_afastamento_id and status = 'pendente';

  update afastamentos.afastamentos
  set status = next_status, updated_at = now()
  where id = target_afastamento_id;

  perform afastamentos.add_movimentacao(
    target_afastamento_id,
    'devolutiva',
    'Devolutiva emitida',
    orientacoes,
    current_status,
    next_status,
    'restrita'
  );
end;
$$;

revoke all on function public.list_medicos_para_avaliacao() from public, anon;
grant execute on function public.list_medicos_para_avaliacao() to authenticated;

revoke all on function public.registrar_triagem_afastamento(uuid, text, text, text, text)
from public, anon;
grant execute on function public.registrar_triagem_afastamento(uuid, text, text, text, text)
to authenticated;

revoke all on function public.registrar_triagem_afastamento(uuid, text, text, text, text, uuid)
from public, anon;
grant execute on function public.registrar_triagem_afastamento(uuid, text, text, text, text, uuid)
to authenticated;

comment on table afastamentos.avaliacoes_medicas is
  'Historico de atribuicoes de processos de afastamento a medicos avaliadores.';

comment on function public.list_medicos_para_avaliacao() is
  'Lista medicos elegiveis ordenados pela menor quantidade de avaliacoes pendentes.';
