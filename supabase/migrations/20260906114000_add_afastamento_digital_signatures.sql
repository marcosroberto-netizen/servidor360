insert into app_auth.permissoes (nome, recurso, acao)
values
  ('Gerar documento digital de afastamento', 'afastamentos', 'gerar_documento'),
  ('Assinar documento digital de afastamento', 'afastamentos', 'assinar_documento'),
  ('Validar documento digital de afastamento', 'afastamentos', 'validar_documento')
on conflict (recurso, acao) do update
set nome = excluded.nome;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
join app_auth.permissoes pe on (pe.recurso, pe.acao) in (
  ('afastamentos', 'gerar_documento'),
  ('afastamentos', 'assinar_documento'),
  ('afastamentos', 'validar_documento')
)
where p.nome in ('administrador', 'cas', 'medico', 'rh')
on conflict (perfil_id, permissao_id) do nothing;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
join app_auth.permissoes pe on pe.recurso = 'afastamentos' and pe.acao = 'validar_documento'
where p.nome in ('gestor_escolar', 'educacao')
on conflict (perfil_id, permissao_id) do nothing;

create sequence if not exists afastamentos.documento_digital_seq;

create table if not exists afastamentos.documentos_digitais (
  id uuid primary key default gen_random_uuid(),
  afastamento_id uuid not null references afastamentos.afastamentos(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  protocolo text not null unique,
  status text not null default 'aguardando_assinatura',
  conteudo jsonb not null,
  hash_sha256 text not null,
  qr_payload text not null,
  criado_por uuid references app_auth.usuarios(id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now(),
  assinado_em timestamptz,
  substituido_por uuid references afastamentos.documentos_digitais(id) on delete set null,
  constraint documentos_digitais_status_check check (status in (
    'rascunho',
    'aguardando_assinatura',
    'assinado',
    'substituido',
    'cancelado'
  )),
  constraint documentos_digitais_hash_check check (hash_sha256 ~ '^[a-f0-9]{64}$')
);

create table if not exists afastamentos.assinaturas_digitais (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references afastamentos.documentos_digitais(id) on delete cascade,
  assinante_id uuid not null references app_auth.usuarios(id) on delete restrict default auth.uid(),
  assinante_nome text not null,
  assinante_email text,
  perfil_assinante text,
  hash_sha256 text not null,
  ip inet,
  user_agent text,
  assinado_em timestamptz not null default now(),
  unique (documento_id, assinante_id)
);

create index if not exists idx_documentos_digitais_afastamento
on afastamentos.documentos_digitais(afastamento_id, criado_em desc);

create index if not exists idx_documentos_digitais_protocolo
on afastamentos.documentos_digitais(protocolo);

create index if not exists idx_assinaturas_digitais_documento
on afastamentos.assinaturas_digitais(documento_id, assinado_em desc);

alter table afastamentos.documentos_digitais enable row level security;
alter table afastamentos.assinaturas_digitais enable row level security;

drop policy if exists "documentos_digitais_select_by_afastamento_scope" on afastamentos.documentos_digitais;
create policy "documentos_digitais_select_by_afastamento_scope"
on afastamentos.documentos_digitais for select
to authenticated
using (public.current_user_can_access_afastamento(afastamento_id));

drop policy if exists "assinaturas_digitais_select_by_document_scope" on afastamentos.assinaturas_digitais;
create policy "assinaturas_digitais_select_by_document_scope"
on afastamentos.assinaturas_digitais for select
to authenticated
using (
  exists (
    select 1
    from afastamentos.documentos_digitais dd
    where dd.id = documento_id
      and public.current_user_can_access_afastamento(dd.afastamento_id)
  )
);

create or replace function afastamentos.next_documento_digital_protocolo()
returns text
language plpgsql
security definer
set search_path = afastamentos, public
as $$
begin
  return 'DOC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('afastamentos.documento_digital_seq')::text, 6, '0');
end;
$$;

create or replace function public.gerar_documento_digital_afastamento(
  target_afastamento_id uuid,
  tipo text,
  titulo text,
  conteudo jsonb,
  hash_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = afastamentos, app_auth, public, auth
as $$
declare
  created_id uuid;
  generated_protocolo text;
begin
  if not public.current_user_has_permission('afastamentos:gerar_documento') then
    raise exception 'Usuario sem permissao para gerar documento digital';
  end if;

  if not public.current_user_can_access_afastamento(target_afastamento_id) then
    raise exception 'Afastamento fora do escopo permitido';
  end if;

  if nullif(tipo, '') is null or nullif(titulo, '') is null then
    raise exception 'Tipo e titulo do documento sao obrigatorios';
  end if;

  if hash_sha256 is null or hash_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'Hash SHA-256 invalido';
  end if;

  generated_protocolo := afastamentos.next_documento_digital_protocolo();

  insert into afastamentos.documentos_digitais (
    afastamento_id,
    tipo,
    titulo,
    protocolo,
    status,
    conteudo,
    hash_sha256,
    qr_payload,
    criado_por
  )
  values (
    target_afastamento_id,
    nullif(tipo, ''),
    nullif(titulo, ''),
    generated_protocolo,
    'aguardando_assinatura',
    conteudo,
    hash_sha256,
    generated_protocolo || ':' || hash_sha256,
    auth.uid()
  )
  returning id into created_id;

  perform afastamentos.add_movimentacao(
    target_afastamento_id,
    'documento_digital',
    'Documento digital gerado',
    'Versao assinavel gerada no cofre digital: ' || generated_protocolo,
    null,
    null,
    'restrita'
  );

  return created_id;
end;
$$;

create or replace function public.assinar_documento_digital_afastamento(
  target_documento_id uuid,
  perfil_assinante text default null,
  user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, app_auth, public, auth
as $$
declare
  documento_record record;
  usuario_record record;
begin
  if not public.current_user_has_permission('afastamentos:assinar_documento') then
    raise exception 'Usuario sem permissao para assinar documento digital';
  end if;

  select *
  into documento_record
  from afastamentos.documentos_digitais
  where id = target_documento_id;

  if documento_record.id is null then
    raise exception 'Documento digital nao encontrado';
  end if;

  if not public.current_user_can_access_afastamento(documento_record.afastamento_id) then
    raise exception 'Documento fora do escopo permitido';
  end if;

  if documento_record.status <> 'aguardando_assinatura' then
    raise exception 'Documento nao esta aguardando assinatura';
  end if;

  select nome_completo, email
  into usuario_record
  from app_auth.usuarios
  where id = auth.uid();

  insert into afastamentos.assinaturas_digitais (
    documento_id,
    assinante_id,
    assinante_nome,
    assinante_email,
    perfil_assinante,
    hash_sha256,
    ip,
    user_agent
  )
  values (
    target_documento_id,
    auth.uid(),
    coalesce(usuario_record.nome_completo, 'Usuario autenticado'),
    usuario_record.email,
    nullif(perfil_assinante, ''),
    documento_record.hash_sha256,
    nullif(split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1), '')::inet,
    nullif(user_agent, '')
  );

  update afastamentos.documentos_digitais
  set status = 'assinado', assinado_em = now()
  where id = target_documento_id;

  perform afastamentos.add_movimentacao(
    documento_record.afastamento_id,
    'assinatura_digital',
    'Documento assinado eletronicamente',
    'Assinatura registrada para o documento ' || documento_record.protocolo,
    null,
    null,
    'restrita'
  );
end;
$$;

create or replace function public.validar_documento_digital_afastamento(target_protocolo text)
returns jsonb
language plpgsql
security definer
set search_path = afastamentos, servidores, app_auth, public, auth
as $$
declare
  result jsonb;
begin
  if not public.current_user_has_permission('afastamentos:validar_documento') then
    raise exception 'Usuario sem permissao para validar documento digital';
  end if;

  select jsonb_build_object(
    'id', dd.id,
    'protocolo', dd.protocolo,
    'titulo', dd.titulo,
    'tipo', dd.tipo,
    'status', dd.status,
    'hashSha256', dd.hash_sha256,
    'assinadoEm', dd.assinado_em,
    'processoProtocolo', a.protocolo,
    'servidorNome', s.nome,
    'assinantes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ad.id,
            'assinanteId', ad.assinante_id,
            'assinanteNome', ad.assinante_nome,
            'assinanteEmail', ad.assinante_email,
            'perfilAssinante', ad.perfil_assinante,
            'assinadoEm', ad.assinado_em,
            'ip', ad.ip::text,
            'userAgent', ad.user_agent
          )
          order by ad.assinado_em desc
        )
        from afastamentos.assinaturas_digitais ad
        where ad.documento_id = dd.id
      ),
      '[]'::jsonb
    )
  )
  into result
  from afastamentos.documentos_digitais dd
  join afastamentos.afastamentos a on a.id = dd.afastamento_id
  join servidores.servidores s on s.id = a.servidor_id
  where dd.protocolo = target_protocolo
    and public.current_user_can_access_afastamento(dd.afastamento_id);

  if result is null then
    raise exception 'Documento digital nao encontrado ou fora do escopo permitido';
  end if;

  return result;
end;
$$;

grant select on afastamentos.documentos_digitais to authenticated;
grant select on afastamentos.assinaturas_digitais to authenticated;
grant execute on function public.gerar_documento_digital_afastamento(uuid, text, text, jsonb, text) to authenticated;
grant execute on function public.assinar_documento_digital_afastamento(uuid, text, text) to authenticated;
grant execute on function public.validar_documento_digital_afastamento(text) to authenticated;

do $$
declare
  target_user_id uuid;
begin
  for target_user_id in
    select distinct usuario_id
    from app_auth.usuario_perfis
  loop
    perform app_auth.sync_user_auth_claims(target_user_id);
  end loop;
end $$;
