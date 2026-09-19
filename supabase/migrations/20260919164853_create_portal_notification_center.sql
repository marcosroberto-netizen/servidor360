create table app_auth.notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references app_auth.usuarios(id) on delete cascade,
  modulo text not null,
  evento text not null,
  titulo text not null,
  mensagem text not null,
  prioridade text not null default 'normal',
  entidade_tipo text,
  entidade_id uuid,
  rota text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pendente',
  criado_por uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now(),
  lida_em timestamptz,
  origem_chave text unique,
  constraint notificacoes_modulo_check check (modulo ~ '^[a-z][a-z0-9_]{1,49}$'),
  constraint notificacoes_evento_check check (evento ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint notificacoes_prioridade_check check (prioridade in ('baixa', 'normal', 'alta', 'critica')),
  constraint notificacoes_status_check check (status in ('pendente', 'lida')),
  constraint notificacoes_rota_check check (rota is null or rota ~ '^/[a-zA-Z0-9/_?=&.-]*$'),
  constraint notificacoes_lida_status_check check (
    (status = 'lida' and lida_em is not null)
    or (status = 'pendente' and lida_em is null)
  )
);

create index notificacoes_destinatario_criado_idx
on app_auth.notificacoes (destinatario_id, criado_em desc);

create index notificacoes_pendentes_destinatario_idx
on app_auth.notificacoes (destinatario_id, criado_em desc)
where status = 'pendente';

alter table app_auth.notificacoes enable row level security;

revoke all on table app_auth.notificacoes from anon, authenticated;
grant select on table app_auth.notificacoes to authenticated;

create policy "notificacoes_select_own"
on app_auth.notificacoes for select
to authenticated
using (destinatario_id = (select auth.uid()));

create or replace function app_auth.publicar_notificacao(
  target_destinatario_id uuid,
  target_modulo text,
  target_evento text,
  target_titulo text,
  target_mensagem text,
  target_prioridade text default 'normal',
  target_entidade_tipo text default null,
  target_entidade_id uuid default null,
  target_rota text default null,
  target_metadata jsonb default '{}'::jsonb,
  target_origem_chave text default null
)
returns uuid
language plpgsql
security invoker
set search_path = app_auth, public, auth
as $$
declare
  notification_id uuid;
begin
  insert into app_auth.notificacoes (
    destinatario_id,
    modulo,
    evento,
    titulo,
    mensagem,
    prioridade,
    entidade_tipo,
    entidade_id,
    rota,
    metadata,
    origem_chave
  ) values (
    target_destinatario_id,
    target_modulo,
    target_evento,
    target_titulo,
    target_mensagem,
    target_prioridade,
    target_entidade_tipo,
    target_entidade_id,
    target_rota,
    coalesce(target_metadata, '{}'::jsonb),
    target_origem_chave
  )
  on conflict (origem_chave)
  do update set
    destinatario_id = excluded.destinatario_id,
    titulo = excluded.titulo,
    mensagem = excluded.mensagem,
    metadata = excluded.metadata
  returning id into notification_id;

  return notification_id;
end;
$$;

revoke all on function app_auth.publicar_notificacao(uuid, text, text, text, text, text, text, uuid, text, jsonb, text)
from public, anon, authenticated;

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

  perform app_auth.publicar_notificacao(
    new.destinatario_id,
    'afastamentos',
    new.tipo,
    new.titulo,
    new.mensagem,
    case when new.tipo in ('complementacao', 'avaliacao') then 'alta' else 'normal' end,
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

create trigger sincronizar_notificacao_afastamento_trigger
after insert or update or delete on afastamentos.notificacoes
for each row execute function app_auth.sincronizar_notificacao_afastamento();

insert into app_auth.notificacoes (
  destinatario_id,
  modulo,
  evento,
  titulo,
  mensagem,
  prioridade,
  entidade_tipo,
  entidade_id,
  rota,
  status,
  criado_por,
  criado_em,
  lida_em,
  metadata,
  origem_chave
)
select
  n.destinatario_id,
  'afastamentos',
  n.tipo,
  n.titulo,
  n.mensagem,
  case when n.tipo in ('complementacao', 'avaliacao') then 'alta' else 'normal' end,
  'afastamento',
  n.afastamento_id,
  '/afastamentos',
  n.status,
  n.criado_por,
  n.criado_em,
  n.lida_em,
  jsonb_build_object('notificacao_legada_id', n.id),
  'afastamentos:' || n.id::text
from afastamentos.notificacoes n
on conflict (origem_chave) do nothing;

create or replace function public.listar_minhas_notificacoes(
  page_size integer default 20
)
returns table (
  id uuid,
  modulo text,
  evento text,
  titulo text,
  mensagem text,
  prioridade text,
  entidade_tipo text,
  entidade_id uuid,
  rota text,
  metadata jsonb,
  status text,
  criado_em timestamptz,
  lida_em timestamptz
)
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  return query
  select
    n.id,
    n.modulo,
    n.evento,
    n.titulo,
    n.mensagem,
    n.prioridade,
    n.entidade_tipo,
    n.entidade_id,
    n.rota,
    n.metadata,
    n.status,
    n.criado_em,
    n.lida_em
  from app_auth.notificacoes n
  where n.destinatario_id = (select auth.uid())
  order by (n.status = 'pendente') desc, n.criado_em desc
  limit least(greatest(coalesce(page_size, 20), 1), 50);
end;
$$;

create or replace function public.contar_minhas_notificacoes_pendentes()
returns integer
language sql
stable
security definer
set search_path = app_auth, public, auth
as $$
  select case
    when (select auth.uid()) is null then 0
    else (
      select count(*)::integer
      from app_auth.notificacoes n
      where n.destinatario_id = (select auth.uid())
        and n.status = 'pendente'
    )
  end;
$$;

create or replace function public.marcar_notificacao_lida(target_notificacao_id uuid)
returns void
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  update app_auth.notificacoes
  set status = 'lida', lida_em = now()
  where id = target_notificacao_id
    and destinatario_id = (select auth.uid())
    and status = 'pendente';
end;
$$;

create or replace function public.marcar_todas_notificacoes_lidas()
returns void
language plpgsql
security definer
set search_path = app_auth, public, auth
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  update app_auth.notificacoes
  set status = 'lida', lida_em = now()
  where destinatario_id = (select auth.uid())
    and status = 'pendente';
end;
$$;

revoke all on function public.listar_minhas_notificacoes(integer) from public, anon;
revoke all on function public.contar_minhas_notificacoes_pendentes() from public, anon;
revoke all on function public.marcar_notificacao_lida(uuid) from public, anon;
revoke all on function public.marcar_todas_notificacoes_lidas() from public, anon;

grant execute on function public.listar_minhas_notificacoes(integer) to authenticated;
grant execute on function public.contar_minhas_notificacoes_pendentes() to authenticated;
grant execute on function public.marcar_notificacao_lida(uuid) to authenticated;
grant execute on function public.marcar_todas_notificacoes_lidas() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'app_auth'
      and tablename = 'notificacoes'
  ) then
    alter publication supabase_realtime add table app_auth.notificacoes;
  end if;
end;
$$;

comment on table app_auth.notificacoes is
  'Central generica de notificacoes do portal para eventos de qualquer modulo.';

comment on function app_auth.publicar_notificacao(uuid, text, text, text, text, text, text, uuid, text, jsonb, text) is
  'API interna para funcoes de dominio publicarem notificacoes. Nao e executavel pelo cliente.';
