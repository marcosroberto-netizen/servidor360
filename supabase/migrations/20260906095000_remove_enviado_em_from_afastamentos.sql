create or replace function public.criar_afastamento(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = afastamentos, servidores, public, auth
as $$
declare
  target_servidor_id uuid;
  target_prontuario_id uuid;
  created_id uuid;
  generated_protocolo text;
  servidor_unidade_id uuid;
begin
  if not public.current_user_has_permission('afastamentos:create') then
    raise exception 'Usuario sem permissao para criar afastamento';
  end if;

  target_servidor_id := nullif(input ->> 'servidorId', '')::uuid;

  if target_servidor_id is null then
    raise exception 'Servidor obrigatorio';
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

  select unidade_id into servidor_unidade_id
  from servidores.servidores
  where id = target_servidor_id;

  if servidor_unidade_id is null then
    raise exception 'Servidor nao encontrado';
  end if;

  if public.current_user_is_gestor_escolar() and not public.current_user_has_unidade(servidor_unidade_id) then
    raise exception 'Servidor fora do escopo permitido';
  end if;

  insert into servidores.prontuarios (servidor_id)
  values (target_servidor_id)
  on conflict (servidor_id) do update
  set updated_at = now()
  returning id into target_prontuario_id;

  generated_protocolo := afastamentos.next_protocolo();

  insert into afastamentos.afastamentos (
    servidor_id,
    prontuario_id,
    iniciado_por,
    status,
    protocolo,
    tipo,
    data_inicio,
    data_fim,
    motivo,
    observacoes,
    documento_origem_nome,
    documento_origem_url,
    documento_origem_tipo
  )
  values (
    target_servidor_id,
    target_prontuario_id,
    auth.uid(),
    'aguardando_analise',
    generated_protocolo,
    nullif(input ->> 'tipo', ''),
    nullif(input ->> 'dataInicio', '')::date,
    nullif(input ->> 'dataFim', '')::date,
    nullif(input ->> 'motivo', ''),
    nullif(input ->> 'observacoes', ''),
    nullif(input ->> 'documentoNome', ''),
    nullif(input ->> 'documentoUrl', ''),
    nullif(input ->> 'documentoTipo', '')
  )
  returning id into created_id;

  perform afastamentos.add_movimentacao(
    created_id,
    'criacao',
    'Afastamento registrado',
    'Processo criado, vinculado ao prontuario funcional e encaminhado ao CAS.',
    null,
    'aguardando_analise',
    'publica'
  );

  return created_id;
end;
$$;

alter table afastamentos.afastamentos
  drop column if exists enviado_em;
