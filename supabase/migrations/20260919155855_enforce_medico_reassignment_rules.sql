create function public.registrar_triagem_afastamento(
  target_afastamento_id uuid,
  resultado text,
  encaminhamento text,
  comentarios text,
  complemento text,
  target_medico_id uuid,
  permitir_reatribuicao boolean
)
returns void
language plpgsql
security definer
set search_path = afastamentos, medicos, servidores, app_auth, public, auth
as $$
declare
  medico_usuario_id uuid;
  medico_nome text;
  current_medico_id uuid;
  current_medico_nome text;
  current_assignment_id uuid;
  current_status text;
begin
  if not public.current_user_has_permission('afastamentos:analisar') then
    raise exception 'Usuario sem permissao para registrar triagem de afastamento';
  end if;

  select a.status into current_status
  from afastamentos.afastamentos a
  where a.id = target_afastamento_id;

  if current_status is null then
    raise exception 'Afastamento nao encontrado';
  end if;

  if current_status in ('avaliado', 'aguardando_rh', 'concluido') then
    raise exception 'A avaliacao ja foi concluida e nao pode ser reencaminhada pela triagem';
  end if;

  if encaminhamento <> 'encaminhar_avaliacao' then
    if target_medico_id is not null or permitir_reatribuicao then
      raise exception 'Medico e reatribuicao so podem ser informados para avaliacao medica/pericial';
    end if;

    perform public.registrar_triagem_afastamento_core(
      target_afastamento_id, resultado, encaminhamento, comentarios, complemento
    );
    return;
  end if;

  if not public.current_user_has_permission('afastamentos:encaminhar_avaliacao') then
    raise exception 'Usuario sem permissao para encaminhar avaliacao';
  end if;

  if nullif(btrim(comentarios), '') is null then
    raise exception 'A justificativa do encaminhamento ou reatribuicao e obrigatoria';
  end if;

  if target_medico_id is null then
    raise exception 'Selecione um medico para encaminhar a avaliacao';
  end if;

  select usr.id, p.nome_completo
  into medico_usuario_id, medico_nome
  from medicos.medicos m
  join servidores.servidores s on s.id = m.servidor_id and s.ativo
  join servidores.pessoas p on p.id = s.pessoa_id
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

  select am.id, am.medico_id, p.nome_completo
  into current_assignment_id, current_medico_id, current_medico_nome
  from afastamentos.avaliacoes_medicas am
  join medicos.medicos m on m.id = am.medico_id
  join servidores.servidores s on s.id = m.servidor_id
  join servidores.pessoas p on p.id = s.pessoa_id
  where am.afastamento_id = target_afastamento_id
    and am.status = 'pendente';

  if current_assignment_id is not null then
    if current_medico_id = target_medico_id then
      raise exception 'Este processo ja esta atribuido a este medico';
    end if;

    if not permitir_reatribuicao then
      raise exception 'O processo ja possui medico. Use a acao explicita de reatribuicao';
    end if;

    if current_status <> 'aguardando_avaliacao' then
      raise exception 'O processo nao esta em estado valido para reatribuicao medica';
    end if;

    update afastamentos.avaliacoes_medicas
    set status = 'cancelada'
    where id = current_assignment_id;

    perform afastamentos.add_movimentacao(
      target_afastamento_id,
      'reatribuicao_medica',
      'Médico avaliador reatribuído',
      format(
        'De: %s%sPara: %s%sJustificativa: %s',
        current_medico_nome,
        E'\n',
        medico_nome,
        E'\n',
        comentarios
      ),
      current_status,
      current_status,
      'restrita'
    );
  else
    if permitir_reatribuicao then
      raise exception 'O processo nao possui atribuicao pendente para reatribuir';
    end if;

    perform public.registrar_triagem_afastamento_core(
      target_afastamento_id, resultado, encaminhamento, comentarios, complemento
    );
  end if;

  insert into afastamentos.avaliacoes_medicas (
    afastamento_id,
    medico_id,
    encaminhado_por
  ) values (
    target_afastamento_id,
    target_medico_id,
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
    case
      when current_assignment_id is null then 'Nova avaliacao medica/pericial atribuida'
      else 'Avaliacao medica/pericial reatribuida'
    end,
    comentarios,
    (select auth.uid())
  );
end;
$$;

create or replace function public.registrar_triagem_afastamento(
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
set search_path = public
as $$
begin
  perform public.registrar_triagem_afastamento(
    target_afastamento_id,
    resultado,
    encaminhamento,
    comentarios,
    complemento,
    target_medico_id,
    false
  );
end;
$$;

revoke all on function public.registrar_triagem_afastamento(
  uuid, text, text, text, text, uuid, boolean
) from public, anon;
grant execute on function public.registrar_triagem_afastamento(
  uuid, text, text, text, text, uuid, boolean
) to authenticated;

comment on function public.registrar_triagem_afastamento(
  uuid, text, text, text, text, uuid, boolean
) is
  'Registra a triagem ou reatribui explicitamente uma avaliacao pendente a outro medico.';
