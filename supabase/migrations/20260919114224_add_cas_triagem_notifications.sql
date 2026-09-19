create table afastamentos.notificacoes (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  destinatario_id uuid not null references app_auth.usuarios(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  status text not null default 'pendente',
  criado_por uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now(),
  lida_em timestamptz,
  constraint notificacoes_tipo_check check (
    tipo in ('triagem', 'complementacao', 'avaliacao', 'homologacao', 'rh')
  ),
  constraint notificacoes_status_check check (status in ('pendente', 'lida')),
  constraint notificacoes_lida_status_check check (
    (status = 'lida' and lida_em is not null)
    or (status = 'pendente' and lida_em is null)
  )
);

create index notificacoes_afastamento_id_idx
on afastamentos.notificacoes (afastamento_id, criado_em desc);

create index notificacoes_destinatario_status_idx
on afastamentos.notificacoes (destinatario_id, status, criado_em desc);

alter table afastamentos.notificacoes enable row level security;

revoke all on table afastamentos.notificacoes from anon, authenticated;
grant select on table afastamentos.notificacoes to authenticated;

create policy "notificacoes_select_own"
on afastamentos.notificacoes for select
to authenticated
using (destinatario_id = (select auth.uid()));

create or replace function public.registrar_triagem_afastamento(
  target_afastamento_id uuid,
  resultado text,
  encaminhamento text,
  comentarios text,
  complemento text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, servidores, app_auth, public, auth
as $$
declare
  current_status text;
  next_status text;
  event_title text;
  notification_tipo text;
  notification_titulo text;
  notification_mensagem text;
  target_permission text;
  target_recurso text;
  target_acao text;
  servidor_unidade_id uuid;
begin
  if not public.current_user_has_permission('afastamentos:analisar') then
    raise exception 'Usuario sem permissao para registrar triagem de afastamento';
  end if;

  if nullif(btrim(comentarios), '') is null then
    raise exception 'Comentarios da triagem sao obrigatorios';
  end if;

  select a.status into current_status
  from afastamentos.afastamentos a
  where a.id = target_afastamento_id;

  if current_status is null then
    raise exception 'Afastamento nao encontrado';
  end if;

  select lf.unidade_id into servidor_unidade_id
  from afastamentos.afastamentos a
  join servidores.lotacoes_funcionais lf
    on lf.vinculo_funcional_id = a.vinculo_funcional_id
  where a.id = target_afastamento_id
    and lf.ativo
  order by lf.principal desc, lf.data_inicio desc nulls last, lf.created_at desc
  limit 1;

  if encaminhamento = 'solicitar_complementacao' then
    if not public.current_user_has_permission('afastamentos:solicitar_complementacao') then
      raise exception 'Usuario sem permissao para solicitar complementacao';
    end if;

    next_status := 'aguardando_complementacao';
    event_title := 'Complementacao solicitada';
    notification_tipo := 'complementacao';
    notification_titulo := 'Complementacao solicitada pelo CAS';
    notification_mensagem := coalesce(nullif(btrim(complemento), ''), comentarios);
    target_permission := 'afastamentos:complementar';

    insert into afastamentos.complementacoes (
      afastamento_id,
      solicitacao,
      solicitada_por
    )
    values (
      target_afastamento_id,
      coalesce(nullif(btrim(complemento), ''), comentarios),
      (select auth.uid())
    );
  elsif encaminhamento = 'encaminhar_avaliacao' then
    if not public.current_user_has_permission('afastamentos:encaminhar_avaliacao') then
      raise exception 'Usuario sem permissao para encaminhar avaliacao';
    end if;

    next_status := 'aguardando_avaliacao';
    event_title := 'Encaminhado para avaliacao';
    notification_tipo := 'avaliacao';
    notification_titulo := 'Processo encaminhado para avaliacao';
    notification_mensagem := comentarios;
    target_permission := 'afastamentos:emitir_devolutiva';
  elsif encaminhamento in ('homologar', 'encaminhar_rh') then
    next_status := 'aguardando_rh';
    event_title := case
      when encaminhamento = 'homologar' then 'Triagem homologada pelo CAS'
      else 'Encaminhado ao RH'
    end;
    notification_tipo := case
      when encaminhamento = 'homologar' then 'homologacao'
      else 'rh'
    end;
    notification_titulo := case
      when encaminhamento = 'homologar' then 'Afastamento homologado pelo CAS'
      else 'Processo encaminhado ao RH'
    end;
    notification_mensagem := comentarios;
    target_permission := 'rh:fila';
  else
    next_status := 'em_analise';
    event_title := 'Triagem registrada';
    notification_tipo := 'triagem';
    notification_titulo := 'Triagem CAS registrada';
    notification_mensagem := comentarios;
    target_permission := 'cas:fila';
  end if;

  update afastamentos.afastamentos
  set status = next_status, updated_at = now()
  where id = target_afastamento_id;

  perform afastamentos.add_movimentacao(
    target_afastamento_id,
    'triagem',
    event_title,
    format(
      'Resultado: %s%s%s',
      coalesce(nullif(btrim(resultado), ''), 'nao_informado'),
      E'\nComentarios: ',
      comentarios
    ),
    current_status,
    next_status,
    'restrita'
  );

  target_recurso := split_part(target_permission, ':', 1);
  target_acao := split_part(target_permission, ':', 2);

  insert into afastamentos.notificacoes (
    afastamento_id,
    destinatario_id,
    tipo,
    titulo,
    mensagem,
    criado_por
  )
  select distinct
    target_afastamento_id,
    u.id,
    notification_tipo,
    notification_titulo,
    notification_mensagem,
    (select auth.uid())
  from app_auth.usuarios u
  join app_auth.usuario_perfis up on up.usuario_id = u.id
  join app_auth.perfis p on p.id = up.perfil_id and p.ativo
  join app_auth.perfil_permissoes pp on pp.perfil_id = p.id
  join app_auth.permissoes pe on pe.id = pp.permissao_id
  left join app_auth.usuario_unidades uu on uu.usuario_id = u.id
  where u.ativo
    and u.id <> (select auth.uid())
    and (
      (pe.recurso = '*' and pe.acao = '*')
      or (pe.recurso = target_recurso and pe.acao = target_acao)
    )
    and (
      target_permission <> 'afastamentos:complementar'
      or servidor_unidade_id is null
      or uu.unidade_id = servidor_unidade_id
      or (pe.recurso = '*' and pe.acao = '*')
    );
end;
$$;

create or replace function public.registrar_analise_afastamento(
  target_afastamento_id uuid,
  analise text,
  proxima_acao text,
  complemento text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, servidores, app_auth, public, auth
as $$
declare
  derived_resultado text;
begin
  derived_resultado := case
    when proxima_acao = 'solicitar_complementacao' then 'documentacao_incompleta'
    when proxima_acao = 'encaminhar_avaliacao' then 'necessita_avaliacao_medica'
    when proxima_acao in ('homologar', 'encaminhar_rh') then 'homologado'
    else 'triagem_registrada'
  end;

  perform public.registrar_triagem_afastamento(
    target_afastamento_id,
    derived_resultado,
    proxima_acao,
    analise,
    complemento
  );
end;
$$;

revoke all on function public.registrar_triagem_afastamento(uuid, text, text, text, text)
from public, anon;
grant execute on function public.registrar_triagem_afastamento(uuid, text, text, text, text)
to authenticated;

revoke all on function public.registrar_analise_afastamento(uuid, text, text, text)
from public, anon;
grant execute on function public.registrar_analise_afastamento(uuid, text, text, text)
to authenticated;

comment on table afastamentos.notificacoes is
  'Notificacoes internas geradas por movimentacoes sensiveis do fluxo de afastamentos.';

comment on function public.registrar_triagem_afastamento(uuid, text, text, text, text) is
  'Registra a triagem administrativa do CAS, atualiza encaminhamento, historico e notificacoes.';
