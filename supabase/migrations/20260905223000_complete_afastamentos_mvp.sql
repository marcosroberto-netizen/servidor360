alter table afastamentos.afastamentos
  add column if not exists tipo text,
  add column if not exists data_inicio date,
  add column if not exists data_fim date,
  add column if not exists motivo text,
  add column if not exists observacoes text,
  add column if not exists documento_origem_nome text,
  add column if not exists documento_origem_url text,
  add column if not exists documento_origem_tipo text,
  add column if not exists enviado_em timestamptz;

alter table afastamentos.afastamentos
  drop constraint if exists afastamentos_periodo_check;

alter table afastamentos.afastamentos
  add constraint afastamentos_periodo_check
  check (data_inicio is null or data_fim is null or data_fim >= data_inicio);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'afastamentos-documentos',
  'afastamentos-documentos',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "afastamentos_documentos_select_authenticated" on storage.objects;
create policy "afastamentos_documentos_select_authenticated"
on storage.objects for select
to authenticated
using (
  bucket_id = 'afastamentos-documentos'
  and (
    public.current_user_has_permission('afastamentos:read')
    or public.current_user_has_permission('afastamentos:create')
  )
);

drop policy if exists "afastamentos_documentos_insert_authorized" on storage.objects;
create policy "afastamentos_documentos_insert_authorized"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'afastamentos-documentos'
  and (
    public.current_user_has_permission('afastamentos:create')
    or public.current_user_has_permission('afastamentos:complementar')
  )
);

create sequence if not exists afastamentos.protocolo_seq;

create table if not exists afastamentos.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  descricao text,
  status_origem text,
  status_destino text,
  visibilidade text not null default 'publica',
  criado_por uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now(),
  constraint movimentacoes_visibilidade_check check (visibilidade in ('publica', 'restrita', 'ocupacional'))
);

create table if not exists afastamentos.complementacoes (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  solicitacao text not null,
  resposta text,
  documento_nome text,
  documento_url text,
  solicitada_por uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  respondida_por uuid references app_auth.usuarios(id) on delete set null,
  solicitada_em timestamptz not null default now(),
  respondida_em timestamptz,
  status text not null default 'pendente',
  constraint complementacoes_status_check check (status in ('pendente', 'respondida'))
);

create table if not exists afastamentos.devolutivas (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  resultado text not null,
  descricao text not null,
  orientacoes text,
  responsavel_id uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  emitida_em timestamptz not null default now(),
  visibilidade text not null default 'restrita',
  constraint devolutivas_resultado_check check (resultado in (
    'apto',
    'inapto',
    'apto_com_restricoes',
    'nova_avaliacao',
    'complementacao',
    'outra'
  )),
  constraint devolutivas_visibilidade_check check (visibilidade in ('publica', 'restrita', 'ocupacional'))
);

create table if not exists afastamentos.providencias (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  descricao text not null,
  responsavel_id uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  registrada_em timestamptz not null default now()
);

create index if not exists idx_afastamentos_protocolo on afastamentos.afastamentos(protocolo);
create index if not exists idx_movimentacoes_afastamento on afastamentos.movimentacoes(afastamento_id, criado_em desc);
create index if not exists idx_complementacoes_afastamento on afastamentos.complementacoes(afastamento_id, solicitada_em desc);
create index if not exists idx_devolutivas_afastamento on afastamentos.devolutivas(afastamento_id, emitida_em desc);
create index if not exists idx_providencias_afastamento on afastamentos.providencias(afastamento_id, registrada_em desc);

alter table afastamentos.movimentacoes enable row level security;
alter table afastamentos.complementacoes enable row level security;
alter table afastamentos.devolutivas enable row level security;
alter table afastamentos.providencias enable row level security;

create or replace function public.current_user_can_access_afastamento(afastamento_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = afastamentos, servidores, public, auth
as $$
  select exists (
    select 1
    from afastamentos.afastamentos a
    join servidores.servidores s on s.id = a.servidor_id
    where a.id = afastamento_uuid
      and (
        public.current_user_has_permission('afastamentos:read')
        or (
          public.current_user_has_permission('afastamentos:create')
          and public.current_user_has_unidade(s.unidade_id)
        )
      )
  );
$$;

create or replace function public.current_user_can_access_ocupacional()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_permission('afastamentos:emitir_devolutiva')
    or public.current_user_has_permission('afastamentos:analisar')
    or public.current_user_has_permission('prontuario_ocupacional:read');
$$;

drop policy if exists "movimentacoes_select_by_afastamento_scope" on afastamentos.movimentacoes;
create policy "movimentacoes_select_by_afastamento_scope"
on afastamentos.movimentacoes for select
to authenticated
using (
  public.current_user_can_access_afastamento(afastamento_id)
  and (
    visibilidade <> 'ocupacional'
    or public.current_user_can_access_ocupacional()
  )
);

drop policy if exists "complementacoes_select_by_afastamento_scope" on afastamentos.complementacoes;
create policy "complementacoes_select_by_afastamento_scope"
on afastamentos.complementacoes for select
to authenticated
using (public.current_user_can_access_afastamento(afastamento_id));

drop policy if exists "devolutivas_select_by_afastamento_scope" on afastamentos.devolutivas;
create policy "devolutivas_select_by_afastamento_scope"
on afastamentos.devolutivas for select
to authenticated
using (
  public.current_user_can_access_afastamento(afastamento_id)
  and (
    public.current_user_has_permission('afastamentos:ler_devolutiva')
    or public.current_user_has_permission('afastamentos:emitir_devolutiva')
  )
  and (
    visibilidade <> 'ocupacional'
    or public.current_user_can_access_ocupacional()
  )
);

drop policy if exists "providencias_select_by_afastamento_scope" on afastamentos.providencias;
create policy "providencias_select_by_afastamento_scope"
on afastamentos.providencias for select
to authenticated
using (
  public.current_user_can_access_afastamento(afastamento_id)
  and (
    public.current_user_has_permission('afastamentos:registrar_providencia')
    or public.current_user_has_permission('afastamentos:concluir')
    or public.current_user_has_permission('afastamentos:read')
  )
);

drop policy if exists "afastamentos_update_by_rpc_only" on afastamentos.afastamentos;
create policy "afastamentos_update_by_rpc_only"
on afastamentos.afastamentos for update
to authenticated
using (false)
with check (false);

create or replace function afastamentos.next_protocolo()
returns text
language plpgsql
security definer
set search_path = afastamentos, public
as $$
begin
  return 'AF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('afastamentos.protocolo_seq')::text, 6, '0');
end;
$$;

create or replace function afastamentos.add_movimentacao(
  target_afastamento_id uuid,
  target_tipo text,
  target_titulo text,
  target_descricao text,
  target_status_origem text,
  target_status_destino text,
  target_visibilidade text default 'publica'
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
begin
  insert into afastamentos.movimentacoes (
    afastamento_id,
    tipo,
    titulo,
    descricao,
    status_origem,
    status_destino,
    visibilidade,
    criado_por
  )
  values (
    target_afastamento_id,
    target_tipo,
    target_titulo,
    nullif(target_descricao, ''),
    target_status_origem,
    target_status_destino,
    coalesce(nullif(target_visibilidade, ''), 'publica'),
    auth.uid()
  );
end;
$$;

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
    documento_origem_tipo,
    enviado_em
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
    nullif(input ->> 'documentoTipo', ''),
    now()
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

create or replace function public.registrar_analise_afastamento(
  target_afastamento_id uuid,
  analise text,
  proxima_acao text,
  complemento text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
declare
  current_status text;
  next_status text;
  event_title text;
begin
  if not public.current_user_has_permission('afastamentos:analisar') then
    raise exception 'Usuario sem permissao para analisar afastamento';
  end if;

  select status into current_status
  from afastamentos.afastamentos
  where id = target_afastamento_id;

  if current_status is null then
    raise exception 'Afastamento nao encontrado';
  end if;

  if proxima_acao = 'solicitar_complementacao' then
    if not public.current_user_has_permission('afastamentos:solicitar_complementacao') then
      raise exception 'Usuario sem permissao para solicitar complementacao';
    end if;
    next_status := 'aguardando_complementacao';
    event_title := 'Complementacao solicitada';

    insert into afastamentos.complementacoes (afastamento_id, solicitacao, solicitada_por)
    values (target_afastamento_id, coalesce(nullif(complemento, ''), analise), auth.uid());
  elsif proxima_acao = 'encaminhar_avaliacao' then
    if not public.current_user_has_permission('afastamentos:encaminhar_avaliacao') then
      raise exception 'Usuario sem permissao para encaminhar avaliacao';
    end if;
    next_status := 'aguardando_avaliacao';
    event_title := 'Encaminhado para avaliacao';
  elsif proxima_acao = 'encaminhar_rh' then
    next_status := 'aguardando_rh';
    event_title := 'Encaminhado ao RH';
  else
    next_status := 'em_analise';
    event_title := 'Analise registrada';
  end if;

  update afastamentos.afastamentos
  set status = next_status, updated_at = now()
  where id = target_afastamento_id;

  perform afastamentos.add_movimentacao(
    target_afastamento_id,
    'analise',
    event_title,
    analise,
    current_status,
    next_status,
    'restrita'
  );
end;
$$;

create or replace function public.responder_complementacao_afastamento(
  target_afastamento_id uuid,
  resposta text,
  documento_nome text default null,
  documento_url text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
declare
  current_status text;
  target_complementacao_id uuid;
begin
  if not public.current_user_has_permission('afastamentos:complementar') then
    raise exception 'Usuario sem permissao para complementar afastamento';
  end if;

  select status into current_status
  from afastamentos.afastamentos
  where id = target_afastamento_id;

  if current_status <> 'aguardando_complementacao' then
    raise exception 'Afastamento nao esta aguardando complementacao';
  end if;

  select id into target_complementacao_id
  from afastamentos.complementacoes
  where afastamento_id = target_afastamento_id
    and status = 'pendente'
  order by solicitada_em desc
  limit 1;

  if target_complementacao_id is null then
    raise exception 'Complementacao pendente nao encontrada';
  end if;

  update afastamentos.complementacoes
  set
    resposta = nullif(resposta, ''),
    documento_nome = nullif(documento_nome, ''),
    documento_url = nullif(documento_url, ''),
    respondida_por = auth.uid(),
    respondida_em = now(),
    status = 'respondida'
  where id = target_complementacao_id;

  update afastamentos.afastamentos
  set status = 'aguardando_analise', updated_at = now()
  where id = target_afastamento_id;

  perform afastamentos.add_movimentacao(
    target_afastamento_id,
    'complementacao',
    'Complementacao respondida',
    resposta,
    current_status,
    'aguardando_analise',
    'publica'
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
set search_path = afastamentos, public, auth
as $$
declare
  current_status text;
  next_status text;
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

  next_status := case when encaminhar_rh then 'aguardando_rh' else 'avaliado' end;

  insert into afastamentos.devolutivas (
    afastamento_id,
    resultado,
    descricao,
    orientacoes,
    responsavel_id,
    visibilidade
  )
  values (
    target_afastamento_id,
    resultado,
    nullif(descricao, ''),
    nullif(orientacoes, ''),
    auth.uid(),
    'restrita'
  );

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

create or replace function public.registrar_providencia_afastamento(
  target_afastamento_id uuid,
  descricao text,
  concluir boolean default false
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
declare
  current_status text;
  next_status text;
begin
  if not public.current_user_has_permission('afastamentos:registrar_providencia') then
    raise exception 'Usuario sem permissao para registrar providencia';
  end if;

  if concluir and not public.current_user_has_permission('afastamentos:concluir') then
    raise exception 'Usuario sem permissao para concluir afastamento';
  end if;

  select status into current_status
  from afastamentos.afastamentos
  where id = target_afastamento_id;

  if current_status is null then
    raise exception 'Afastamento nao encontrado';
  end if;

  if exists (
    select 1
    from afastamentos.complementacoes
    where afastamento_id = target_afastamento_id
      and status = 'pendente'
  ) then
    raise exception 'Nao e possivel concluir com complementacao pendente';
  end if;

  insert into afastamentos.providencias (afastamento_id, descricao, responsavel_id)
  values (target_afastamento_id, nullif(descricao, ''), auth.uid());

  next_status := case when concluir then 'concluido' else 'aguardando_rh' end;

  update afastamentos.afastamentos
  set status = next_status, updated_at = now()
  where id = target_afastamento_id;

  perform afastamentos.add_movimentacao(
    target_afastamento_id,
    'providencia',
    case when concluir then 'Providencia registrada e processo concluido' else 'Providencia administrativa registrada' end,
    descricao,
    current_status,
    next_status,
    'restrita'
  );
end;
$$;

grant select on afastamentos.movimentacoes to authenticated;
grant select on afastamentos.complementacoes to authenticated;
grant select on afastamentos.devolutivas to authenticated;
grant select on afastamentos.providencias to authenticated;
grant execute on function public.current_user_can_access_afastamento(uuid) to authenticated;
grant execute on function public.current_user_can_access_ocupacional() to authenticated;
grant execute on function public.criar_afastamento(jsonb) to authenticated;
grant execute on function public.registrar_analise_afastamento(uuid, text, text, text) to authenticated;
grant execute on function public.responder_complementacao_afastamento(uuid, text, text, text) to authenticated;
grant execute on function public.emitir_devolutiva_afastamento(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.registrar_providencia_afastamento(uuid, text, boolean) to authenticated;
