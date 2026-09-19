do $$
declare
  cas_unidade_id uuid;
  medico_perfil_id uuid;
  medico_cargo_id uuid;
  estatutario_regime_id uuid;
  medicina_trabalho_id uuid;
  demo record;
  servidor_uuid uuid;
  vinculo_uuid uuid;
  medico_uuid uuid;
begin
  select id into cas_unidade_id
  from organizacional.unidades
  where nome = 'Complexo CAS' and ativo
  limit 1;

  select id into medico_perfil_id
  from app_auth.perfis
  where nome = 'medico' and ativo
  limit 1;

  select id into estatutario_regime_id
  from servidores.regimes_vinculo
  where codigo = 'estatutario' and ativo
  limit 1;

  if cas_unidade_id is null then
    raise exception 'Unidade Complexo CAS nao encontrada';
  end if;

  if medico_perfil_id is null then
    raise exception 'Perfil medico nao encontrado';
  end if;

  if estatutario_regime_id is null then
    raise exception 'Regime estatutario nao encontrado';
  end if;

  insert into servidores.cargos (codigo, nome, descricao)
  values ('medico', 'Médico', 'Cargo médico para atendimento e avaliação pericial.')
  on conflict (codigo) do update
  set nome = excluded.nome,
      descricao = excluded.descricao,
      ativo = true
  returning id into medico_cargo_id;

  insert into medicos.especialidades (nome, ativo)
  values ('Medicina do Trabalho', true)
  on conflict (nome) do update set ativo = true
  returning id into medicina_trabalho_id;

  for demo in
    select *
    from (values
      ('medico1@servidor360.local', 'MED-CAS-001', 'CRM', '210001', 'SP'),
      ('medico2@servidor360.local', 'MED-CAS-002', 'CRM', '210002', 'SP'),
      ('medico3@servidor360.local', 'MED-CAS-003', 'CRM', '210003', 'SP'),
      ('medico4@servidor360.local', 'MED-CAS-004', 'CRM', '210004', 'SP')
    ) as dados(email, matricula, conselho, registro, uf)
  loop
    if not exists (
      select 1 from app_auth.usuarios u
      where u.email = demo.email and u.ativo
    ) then
      raise exception 'Usuario de teste % nao encontrado ou inativo', demo.email;
    end if;

    insert into app_auth.usuario_perfis (usuario_id, perfil_id)
    select u.id, medico_perfil_id
    from app_auth.usuarios u
    where u.email = demo.email
    on conflict (usuario_id, perfil_id) do nothing;

    insert into app_auth.usuario_unidades (usuario_id, unidade_id)
    select u.id, cas_unidade_id
    from app_auth.usuarios u
    where u.email = demo.email
    on conflict (usuario_id, unidade_id) do nothing;

    insert into servidores.servidores (pessoa_id, ativo)
    select u.pessoa_id, true
    from app_auth.usuarios u
    where u.email = demo.email
    on conflict (pessoa_id) do update set ativo = true
    returning id into servidor_uuid;

    insert into servidores.vinculos_funcionais (
      servidor_id,
      matricula,
      regime_vinculo_id,
      cargo_id,
      data_inicio,
      principal,
      ativo
    ) values (
      servidor_uuid,
      demo.matricula,
      estatutario_regime_id,
      medico_cargo_id,
      current_date,
      true,
      true
    )
    on conflict (servidor_id, matricula) do update
    set regime_vinculo_id = excluded.regime_vinculo_id,
        cargo_id = excluded.cargo_id,
        principal = true,
        ativo = true
    returning id into vinculo_uuid;

    insert into servidores.lotacoes_funcionais (
      vinculo_funcional_id,
      unidade_id,
      data_inicio,
      principal,
      ativo
    ) values (
      vinculo_uuid,
      cas_unidade_id,
      current_date,
      true,
      true
    )
    on conflict (vinculo_funcional_id) where principal and ativo do update
    set unidade_id = excluded.unidade_id,
        data_fim = null,
        ativo = true;

    insert into medicos.medicos (
      servidor_id,
      disponivel_para_agendamento,
      ativo
    ) values (
      servidor_uuid,
      true,
      true
    )
    on conflict (servidor_id) do update
    set disponivel_para_agendamento = true,
        ativo = true
    returning id into medico_uuid;

    insert into medicos.registros_profissionais (
      medico_id,
      conselho,
      numero,
      uf,
      principal,
      ativo
    ) values (
      medico_uuid,
      demo.conselho,
      demo.registro,
      demo.uf,
      true,
      true
    )
    on conflict (conselho, uf, numero) do update
    set medico_id = excluded.medico_id,
        principal = true,
        ativo = true;

    insert into medicos.medico_especialidades (
      medico_id,
      especialidade_id,
      principal
    ) values (
      medico_uuid,
      medicina_trabalho_id,
      true
    )
    on conflict (medico_id, especialidade_id) do update
    set principal = true;

    insert into medicos.locais_atendimento (
      medico_id,
      unidade_id,
      principal,
      ativo
    ) values (
      medico_uuid,
      cas_unidade_id,
      true,
      true
    )
    on conflict (medico_id, unidade_id) do update
    set principal = true,
        ativo = true;

    perform app_auth.sync_user_auth_claims(
      (select u.id from app_auth.usuarios u where u.email = demo.email)
    );
  end loop;
end
$$;
