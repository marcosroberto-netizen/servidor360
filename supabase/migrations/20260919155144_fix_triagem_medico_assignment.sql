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
      target_afastamento_id, resultado, encaminhamento, comentarios, complemento
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
    target_afastamento_id, resultado, encaminhamento, comentarios, complemento
  );

  update afastamentos.avaliacoes_medicas
  set status = 'cancelada'
  where afastamento_id = target_afastamento_id and status = 'pendente';

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
    'Nova avaliacao medica/pericial atribuida',
    comentarios,
    (select auth.uid())
  );
end;
$$;

revoke all on function public.registrar_triagem_afastamento(
  uuid, text, text, text, text, uuid
) from public, anon;
grant execute on function public.registrar_triagem_afastamento(
  uuid, text, text, text, text, uuid
) to authenticated;

comment on function public.registrar_triagem_afastamento(
  uuid, text, text, text, text, uuid
) is
  'Registra a triagem CAS e, na avaliacao pericial, atribui o processo ao medico informado.';
