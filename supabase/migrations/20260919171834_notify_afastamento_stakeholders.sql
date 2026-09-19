create or replace function afastamentos.notificar_participantes_status()
returns trigger
language plpgsql
security definer
set search_path = afastamentos, app_auth, public, auth
as $$
declare
  recipient record;
  event_name text;
  notification_title text;
  notification_message text;
  notification_priority text;
  actor_label text;
  status_label text;
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  status_label := case new.status
    when 'rascunho' then 'Rascunho'
    when 'registrado' then 'Registrado'
    when 'encaminhado' then 'Encaminhado'
    when 'aguardando_analise' then 'Aguardando análise'
    when 'em_analise' then 'Em análise'
    when 'aguardando_complementacao' then 'Aguardando complementação'
    when 'aguardando_avaliacao' then 'Aguardando avaliação médica'
    when 'avaliado' then 'Avaliado'
    when 'aguardando_rh' then 'Aguardando providência do DP'
    when 'concluido' then 'Concluído'
    else initcap(replace(new.status, '_', ' '))
  end;

  if tg_op = 'INSERT' then
    event_name := 'atestado_enviado';
    notification_title := 'Novo atestado enviado';
    notification_message := format(
      'O atestado %s foi enviado pela escola e aguarda acompanhamento.',
      coalesce(new.protocolo, 'sem protocolo')
    );
    notification_priority := 'alta';
  else
    actor_label := case
      when public.current_user_has_permission('cas:fila') then 'CAS'
      when public.current_user_has_permission('rh:fila') then 'DP'
      when public.current_user_has_permission('educacao:read') then 'Educação'
      else 'escola responsável'
    end;
    event_name := 'status_alterado';
    notification_title := 'Atestado atualizado';
    notification_message := format(
      '%s atualizou o atestado %s para “%s”.',
      actor_label,
      coalesce(new.protocolo, 'sem protocolo'),
      status_label
    );
    notification_priority := case
      when new.status in ('aguardando_complementacao', 'aguardando_avaliacao') then 'alta'
      else 'normal'
    end;
  end if;

  for recipient in
    with operational_users as (
      select
        u.id,
        bool_or(pe.recurso = 'cas' and pe.acao = 'fila') as is_cas,
        bool_or(pe.recurso = 'rh' and pe.acao = 'fila') as is_dp,
        bool_or(pe.recurso = 'educacao' and pe.acao = 'read') as is_educacao
      from app_auth.usuarios u
      join app_auth.usuario_perfis up on up.usuario_id = u.id
      join app_auth.perfis p on p.id = up.perfil_id and p.ativo
      join app_auth.perfil_permissoes pp on pp.perfil_id = p.id
      join app_auth.permissoes pe on pe.id = pp.permissao_id
      where u.ativo
        and (
          (pe.recurso = 'cas' and pe.acao = 'fila')
          or (pe.recurso = 'rh' and pe.acao = 'fila')
          or (pe.recurso = 'educacao' and pe.acao = 'read')
        )
      group by u.id
    ),
    candidates as (
      select
        ou.id,
        case
          when ou.is_cas then '/afastamentos/cas'
          when ou.is_dp then '/afastamentos/dp'
          else '/afastamentos/educacao'
        end as rota,
        case when ou.is_cas then 1 when ou.is_dp then 2 else 3 end as route_priority
      from operational_users ou

      union all

      select new.iniciado_por, '/afastamentos', 4
      where tg_op = 'UPDATE'
    )
    select distinct on (c.id) c.id, c.rota
    from candidates c
    where c.id is not null
      and c.id <> (select auth.uid())
    order by c.id, c.route_priority
  loop
    perform app_auth.publicar_notificacao(
      recipient.id,
      'afastamentos',
      event_name,
      notification_title,
      notification_message,
      notification_priority,
      'afastamento',
      new.id,
      recipient.rota,
      jsonb_build_object(
        'protocolo', new.protocolo,
        'status_anterior', case when tg_op = 'UPDATE' then old.status else null end,
        'status_atual', new.status
      ),
      format(
        'afastamentos:status:%s:%s:%s:%s',
        new.id,
        new.status,
        txid_current(),
        recipient.id
      )
    );
  end loop;

  return new;
end;
$$;

revoke all on function afastamentos.notificar_participantes_status()
from public, anon, authenticated;

create trigger notificar_participantes_novo_afastamento
after insert on afastamentos.afastamentos
for each row execute function afastamentos.notificar_participantes_status();

create trigger notificar_participantes_status_afastamento
after update of status on afastamentos.afastamentos
for each row
when (old.status is distinct from new.status)
execute function afastamentos.notificar_participantes_status();

create or replace function app_auth.sincronizar_notificacao_afastamento()
returns trigger
language plpgsql
security definer
set search_path = app_auth, afastamentos, public, auth
as $$
begin
  if tg_op = 'DELETE' then
    delete from app_auth.notificacoes
    where origem_chave = 'afastamentos:' || old.id::text;
    return old;
  end if;

  -- Mudanças de status são publicadas pelo trigger do processo. A tabela
  -- legada permanece sincronizada apenas para a atribuição privada ao médico.
  if new.tipo <> 'avaliacao' then
    return new;
  end if;

  perform app_auth.publicar_notificacao(
    new.destinatario_id,
    'afastamentos',
    new.tipo,
    new.titulo,
    new.mensagem,
    'alta',
    'afastamento',
    new.afastamento_id,
    '/afastamentos',
    jsonb_build_object('notificacao_legada_id', new.id),
    'afastamentos:' || new.id::text
  );

  update app_auth.notificacoes
  set
    status = new.status,
    lida_em = new.lida_em,
    criado_em = new.criado_em,
    criado_por = new.criado_por
  where origem_chave = 'afastamentos:' || new.id::text;

  return new;
end;
$$;

revoke all on function app_auth.sincronizar_notificacao_afastamento()
from public, anon, authenticated;

comment on function afastamentos.notificar_participantes_status() is
  'Notifica CAS, DP, Educacao e o autor escolar a cada mudanca de estado do afastamento.';
