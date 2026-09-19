-- Core identity and organizational catalogs
create table servidores.pessoas (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  cpf text unique,
  data_nascimento date,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pessoas_nome_completo_check check (btrim(nome_completo) <> ''),
  constraint pessoas_cpf_check check (cpf is null or cpf ~ '^[0-9]{11}$')
);

create table servidores.cargos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cargos_codigo_check check (codigo ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint cargos_nome_check check (btrim(nome) <> '')
);

create table servidores.regimes_vinculo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  exige_instrumento boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regimes_vinculo_codigo_check check (codigo ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint regimes_vinculo_nome_check check (btrim(nome) <> '')
);

create table organizacional.tipos_unidade (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tipos_unidade_codigo_check check (codigo ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint tipos_unidade_nome_check check (btrim(nome) <> '')
);

insert into servidores.pessoas (id, nome_completo, cpf, ativo, created_at, updated_at)
select id, nome, cpf, ativo, created_at, updated_at
from servidores.servidores;

insert into servidores.pessoas (id, nome_completo, cpf, ativo, created_at, updated_at)
select id, nome_completo, cpf, ativo, created_at, updated_at
from app_auth.usuarios
on conflict (id) do nothing;

insert into servidores.cargos (codigo, nome)
select 'cargo_' || substr(md5(cargo), 1, 12), cargo
from servidores.servidores
where nullif(btrim(cargo), '') is not null
group by cargo;

insert into servidores.regimes_vinculo (codigo, nome, exige_instrumento)
values
  ('estatutario', 'Estatutário', false),
  ('celetista', 'Celetista', false),
  ('temporario', 'Temporário', true),
  ('comissionado', 'Comissionado', true),
  ('outro', 'Outro', false),
  ('nao_informado', 'Não informado', false);

insert into organizacional.tipos_unidade (codigo, nome)
select tipo, initcap(tipo)
from organizacional.unidades
group by tipo;

alter table organizacional.unidades
  add column tipo_unidade_id uuid references organizacional.tipos_unidade(id) on delete restrict;

update organizacional.unidades u
set tipo_unidade_id = tu.id
from organizacional.tipos_unidade tu
where tu.codigo = u.tipo;

alter table organizacional.unidades
  alter column tipo_unidade_id set not null;

alter table servidores.servidores
  add column pessoa_id uuid references servidores.pessoas(id) on delete restrict;

update servidores.servidores
set pessoa_id = id;

alter table servidores.servidores
  alter column pessoa_id set not null,
  add constraint servidores_pessoa_id_key unique (pessoa_id);

alter table app_auth.usuarios
  add column pessoa_id uuid references servidores.pessoas(id) on delete restrict;

update app_auth.usuarios u
set pessoa_id = coalesce(
  (
    select p.id
    from servidores.pessoas p
    where u.cpf is not null and p.cpf = u.cpf
    limit 1
  ),
  u.id
);

alter table app_auth.usuarios
  alter column pessoa_id set not null,
  add constraint usuarios_pessoa_id_key unique (pessoa_id);

alter table servidores.vinculos_funcionais
  add column regime_vinculo_id uuid references servidores.regimes_vinculo(id) on delete restrict;

update servidores.vinculos_funcionais vf
set regime_vinculo_id = rv.id
from servidores.regimes_vinculo rv
where rv.codigo = vf.tipo_vinculo;

alter table servidores.vinculos_funcionais
  alter column regime_vinculo_id set not null;

create table servidores.lotacoes_funcionais (
  id uuid primary key default gen_random_uuid(),
  vinculo_funcional_id uuid not null references servidores.vinculos_funcionais(id) on delete cascade,
  unidade_id uuid not null references organizacional.unidades(id) on delete restrict,
  setor_id uuid references organizacional.setores(id) on delete restrict,
  cargo_id uuid references servidores.cargos(id) on delete restrict,
  data_inicio date,
  data_fim date,
  principal boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lotacoes_funcionais_periodo_check
    check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);

insert into servidores.lotacoes_funcionais (
  vinculo_funcional_id,
  unidade_id,
  cargo_id,
  data_inicio,
  principal,
  ativo
)
select
  vf.id,
  vf.unidade_id,
  c.id,
  vf.data_inicio,
  vf.principal,
  vf.ativo
from servidores.vinculos_funcionais vf
left join servidores.cargos c on c.nome = vf.cargo;

create unique index lotacoes_funcionais_principal_ativa_idx
on servidores.lotacoes_funcionais (vinculo_funcional_id)
where principal and ativo;

create index lotacoes_funcionais_vinculo_id_idx
on servidores.lotacoes_funcionais (vinculo_funcional_id);

create index lotacoes_funcionais_unidade_id_idx
on servidores.lotacoes_funcionais (unidade_id);

create index lotacoes_funcionais_setor_id_idx
on servidores.lotacoes_funcionais (setor_id)
where setor_id is not null;

create index lotacoes_funcionais_cargo_id_idx
on servidores.lotacoes_funcionais (cargo_id)
where cargo_id is not null;

create index servidores_pessoa_id_idx on servidores.servidores (pessoa_id);
create index usuarios_pessoa_id_idx on app_auth.usuarios (pessoa_id);
create index vinculos_funcionais_regime_id_idx
on servidores.vinculos_funcionais (regime_vinculo_id);
create index unidades_tipo_unidade_id_idx
on organizacional.unidades (tipo_unidade_id);

create trigger set_pessoas_updated_at
before update on servidores.pessoas
for each row execute function public.set_updated_at();

create trigger set_cargos_updated_at
before update on servidores.cargos
for each row execute function public.set_updated_at();

create trigger set_regimes_vinculo_updated_at
before update on servidores.regimes_vinculo
for each row execute function public.set_updated_at();

create trigger set_tipos_unidade_updated_at
before update on organizacional.tipos_unidade
for each row execute function public.set_updated_at();

create trigger set_lotacoes_funcionais_updated_at
before update on servidores.lotacoes_funcionais
for each row execute function public.set_updated_at();

create function servidores.validar_setor_lotacao()
returns trigger
language plpgsql
set search_path = servidores, organizacional, public
as $$
begin
  if new.setor_id is not null and not exists (
    select 1
    from organizacional.setores s
    where s.id = new.setor_id
      and s.unidade_id = new.unidade_id
  ) then
    raise exception 'O setor informado não pertence à unidade da lotação';
  end if;

  return new;
end;
$$;

create trigger validar_setor_lotacao
before insert or update of setor_id, unidade_id
on servidores.lotacoes_funcionais
for each row execute function servidores.validar_setor_lotacao();

-- Authorization helpers for the normalized functional structure
create or replace function public.current_user_can_access_servidor(target_servidor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = servidores, app_auth, public, auth
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from servidores.servidores s
      where s.id = target_servidor_id
        and s.ativo
        and (
          public.current_user_has_permission('servidores:read')
          or (
            public.current_user_has_permission('afastamentos:create')
            and exists (
              select 1
              from servidores.vinculos_funcionais vf
              join servidores.lotacoes_funcionais lf
                on lf.vinculo_funcional_id = vf.id
              where vf.servidor_id = s.id
                and vf.ativo
                and lf.ativo
                and lf.principal
                and public.current_user_has_unidade(lf.unidade_id)
            )
          )
        )
    );
$$;

create or replace function public.current_user_can_access_afastamento(afastamento_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = afastamentos, servidores, public, auth
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from afastamentos.afastamentos a
      where a.id = afastamento_uuid
        and (
          public.current_user_has_permission('afastamentos:read')
          or public.current_user_can_access_servidor(a.servidor_id)
        )
    );
$$;

-- Stable public read models. Domain tables remain normalized.
create or replace function public.list_servidores_for_afastamentos(
  allowed_unidades uuid[] default null
)
returns table (
  id uuid,
  nome text,
  matricula text,
  cpf text,
  cargo text,
  unidade_id uuid,
  unidade_nome text,
  ativo boolean
)
language sql
stable
security definer
set search_path = servidores, organizacional, public, auth
as $$
  select
    s.id,
    p.nome_completo,
    vf.matricula,
    p.cpf,
    c.nome,
    lf.unidade_id,
    u.nome,
    s.ativo and vf.ativo and lf.ativo
  from servidores.servidores s
  join servidores.pessoas p on p.id = s.pessoa_id
  join servidores.vinculos_funcionais vf
    on vf.servidor_id = s.id and vf.ativo and vf.principal
  join servidores.lotacoes_funcionais lf
    on lf.vinculo_funcional_id = vf.id and lf.ativo and lf.principal
  join organizacional.unidades u on u.id = lf.unidade_id
  left join servidores.cargos c on c.id = lf.cargo_id
  where (select auth.uid()) is not null
    and public.current_user_can_access_servidor(s.id)
    and (allowed_unidades is null or lf.unidade_id = any(allowed_unidades))
  order by p.nome_completo;
$$;

create or replace function public.get_servidores_resumo_for_afastamentos(servidor_ids uuid[])
returns table (
  id uuid,
  nome text,
  matricula text,
  cpf text,
  cargo text,
  unidade_id uuid,
  unidade_nome text,
  ativo boolean
)
language sql
stable
security definer
set search_path = servidores, afastamentos, organizacional, public, auth
as $$
  select distinct
    s.id,
    p.nome_completo,
    vf.matricula,
    p.cpf,
    c.nome,
    lf.unidade_id,
    u.nome,
    s.ativo and vf.ativo and lf.ativo
  from servidores.servidores s
  join servidores.pessoas p on p.id = s.pessoa_id
  join servidores.vinculos_funcionais vf
    on vf.servidor_id = s.id and vf.ativo and vf.principal
  join servidores.lotacoes_funcionais lf
    on lf.vinculo_funcional_id = vf.id and lf.ativo and lf.principal
  join organizacional.unidades u on u.id = lf.unidade_id
  left join servidores.cargos c on c.id = lf.cargo_id
  left join afastamentos.afastamentos a on a.servidor_id = s.id
  where (select auth.uid()) is not null
    and s.id = any(servidor_ids)
    and (
      public.current_user_can_access_servidor(s.id)
      or public.current_user_can_access_afastamento(a.id)
    );
$$;

-- Auth keeps access data only; person data lives in servidores.pessoas.
create or replace function app_auth.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = app_auth, servidores, public, auth
as $$
declare
  default_perfil_id uuid;
  target_nome text;
begin
  target_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome_completo', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'Usuario'), '@', 1)
  );

  insert into servidores.pessoas (id, nome_completo, cpf)
  values (new.id, target_nome, nullif(new.raw_user_meta_data ->> 'cpf', ''))
  on conflict (id) do update
  set
    nome_completo = excluded.nome_completo,
    cpf = coalesce(excluded.cpf, servidores.pessoas.cpf);

  insert into app_auth.usuarios (id, pessoa_id, email)
  values (new.id, new.id, coalesce(new.email, ''))
  on conflict (id) do update
  set email = excluded.email, pessoa_id = excluded.pessoa_id;

  select id into default_perfil_id
  from app_auth.perfis
  where nome = 'servidor';

  if default_perfil_id is not null then
    insert into app_auth.usuario_perfis (usuario_id, perfil_id)
    values (new.id, default_perfil_id)
    on conflict (usuario_id, perfil_id) do nothing;
  end if;

  perform app_auth.sync_user_auth_claims(new.id);
  return new;
end;
$$;

create or replace function app_auth.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = app_auth, servidores, public, auth
as $$
begin
  update app_auth.usuarios
  set email = coalesce(new.email, app_auth.usuarios.email)
  where id = new.id;

  update servidores.pessoas p
  set
    nome_completo = coalesce(
      nullif(new.raw_user_meta_data ->> 'nome_completo', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      p.nome_completo
    ),
    cpf = coalesce(nullif(new.raw_user_meta_data ->> 'cpf', ''), p.cpf)
  from app_auth.usuarios u
  where u.id = new.id and p.id = u.pessoa_id;

  return new;
end;
$$;

create or replace function public.get_current_user_authz()
returns jsonb
language sql
stable
security definer
set search_path = app_auth, servidores, public, auth
as $$
  select jsonb_build_object(
    'usuario',
    (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'nome_completo', p.nome_completo,
        'cpf', p.cpf,
        'ativo', u.ativo,
        'created_at', u.created_at,
        'updated_at', u.updated_at
      )
      from app_auth.usuarios u
      join servidores.pessoas p on p.id = u.pessoa_id
      where u.id = (select auth.uid())
    ),
    'perfis', app_auth.user_authz_payload((select auth.uid())) -> 'perfis',
    'permissoes', app_auth.user_authz_payload((select auth.uid())) -> 'permissoes',
    'unidades', app_auth.user_authz_payload((select auth.uid())) -> 'unidades',
    'setores', app_auth.user_authz_payload((select auth.uid())) -> 'setores'
  );
$$;

-- Afastamento RPCs now resolve unit and identity through the normalized model.
create or replace function public.criar_afastamento(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = afastamentos, servidores, public, auth
as $$
declare
  target_servidor_id uuid;
  created_id uuid;
  generated_protocolo text;
begin
  if not public.current_user_has_permission('afastamentos:create') then
    raise exception 'Usuario sem permissao para criar afastamento';
  end if;

  target_servidor_id := nullif(input ->> 'servidorId', '')::uuid;

  if target_servidor_id is null or not public.current_user_can_access_servidor(target_servidor_id) then
    raise exception 'Servidor nao encontrado ou fora do escopo permitido';
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

  insert into servidores.prontuarios (servidor_id)
  values (target_servidor_id)
  on conflict (servidor_id) do update set updated_at = now();

  generated_protocolo := afastamentos.next_protocolo();

  insert into afastamentos.afastamentos (
    servidor_id, iniciado_por, status, protocolo, tipo, data_inicio, data_fim,
    motivo, observacoes, documento_origem_nome, documento_origem_url,
    documento_origem_tipo
  )
  values (
    target_servidor_id, (select auth.uid()), 'aguardando_analise', generated_protocolo,
    nullif(input ->> 'tipo', ''), nullif(input ->> 'dataInicio', '')::date,
    nullif(input ->> 'dataFim', '')::date, nullif(input ->> 'motivo', ''),
    nullif(input ->> 'observacoes', ''), nullif(input ->> 'documentoNome', ''),
    nullif(input ->> 'documentoUrl', ''), nullif(input ->> 'documentoTipo', '')
  )
  returning id into created_id;

  perform afastamentos.add_movimentacao(
    created_id, 'criacao', 'Afastamento registrado',
    'Processo criado e encaminhado ao CAS.', null, 'aguardando_analise', 'publica'
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
set search_path = afastamentos, app_auth, servidores, public, auth
as $$
declare
  documento_record record;
  usuario_record record;
begin
  if not public.current_user_has_permission('afastamentos:assinar_documento') then
    raise exception 'Usuario sem permissao para assinar documento digital';
  end if;

  select * into documento_record
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

  select p.nome_completo, u.email
  into usuario_record
  from app_auth.usuarios u
  join servidores.pessoas p on p.id = u.pessoa_id
  where u.id = (select auth.uid());

  insert into afastamentos.assinaturas_digitais (
    documento_id, assinante_id, assinante_nome, assinante_email,
    perfil_assinante, hash_sha256, ip, user_agent
  )
  values (
    target_documento_id, (select auth.uid()),
    coalesce(usuario_record.nome_completo, 'Usuario autenticado'),
    usuario_record.email, nullif(perfil_assinante, ''), documento_record.hash_sha256,
    nullif(split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1), '')::inet,
    nullif(user_agent, '')
  );

  update afastamentos.documentos_digitais
  set status = 'assinado', assinado_em = now()
  where id = target_documento_id;

  perform afastamentos.add_movimentacao(
    documento_record.afastamento_id, 'assinatura_digital',
    'Documento assinado eletronicamente',
    'Assinatura registrada para o documento ' || documento_record.protocolo,
    null, null, 'restrita'
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
    'servidorNome', p.nome_completo,
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
          ) order by ad.assinado_em desc
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
  join servidores.pessoas p on p.id = s.pessoa_id
  where dd.protocolo = target_protocolo
    and public.current_user_can_access_afastamento(dd.afastamento_id);

  if result is null then
    raise exception 'Documento digital nao encontrado ou fora do escopo permitido';
  end if;
  return result;
end;
$$;

-- Replace policies that depended on denormalized server columns.
drop policy if exists "servidores_admin_write" on servidores.servidores;
drop policy if exists "servidores_select_by_permission_scope" on servidores.servidores;
create policy "servidores_select"
on servidores.servidores for select to authenticated
using (public.current_user_can_access_servidor(id));
create policy "servidores_insert"
on servidores.servidores for insert to authenticated
with check (public.current_user_has_permission('servidores:write'));
create policy "servidores_update"
on servidores.servidores for update to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));
create policy "servidores_delete"
on servidores.servidores for delete to authenticated
using (public.current_user_has_permission('servidores:delete'));

drop policy if exists "prontuarios_select_by_servidor_scope" on servidores.prontuarios;
create policy "prontuarios_select"
on servidores.prontuarios for select to authenticated
using (
  public.current_user_has_permission('prontuario:read')
  or public.current_user_can_access_servidor(servidor_id)
);

drop policy if exists "afastamentos_select_by_permission_scope" on afastamentos.afastamentos;
drop policy if exists "afastamentos_insert_by_servidor_scope" on afastamentos.afastamentos;
create policy "afastamentos_select"
on afastamentos.afastamentos for select to authenticated
using (public.current_user_can_access_afastamento(id));
create policy "afastamentos_insert"
on afastamentos.afastamentos for insert to authenticated
with check (
  public.current_user_has_permission('afastamentos:create')
  and iniciado_por = (select auth.uid())
  and public.current_user_can_access_servidor(servidor_id)
);

drop policy if exists "vinculos_funcionais_select" on servidores.vinculos_funcionais;
create policy "vinculos_funcionais_select"
on servidores.vinculos_funcionais for select to authenticated
using (public.current_user_can_access_servidor(servidor_id));

drop policy if exists "afastamentos_documentos_select_authorized" on storage.objects;
create policy "afastamentos_documentos_select_authorized"
on storage.objects for select to authenticated
using (
  bucket_id = 'afastamentos-documentos'
  and public.current_user_has_permission('afastamentos:visualizar_documento')
  and (
    not public.current_user_is_gestor_escolar()
    or (
      split_part(name, '/', 1) = 'origem'
      and split_part(name, '/', 2) ~* '^[0-9a-f-]{36}$'
      and public.current_user_can_access_servidor(split_part(name, '/', 2)::uuid)
    )
    or (
      split_part(name, '/', 1) = 'complementacoes'
      and split_part(name, '/', 2) ~* '^[0-9a-f-]{36}$'
      and public.current_user_can_access_afastamento(split_part(name, '/', 2)::uuid)
    )
  )
);

-- RLS for new core tables
alter table servidores.pessoas enable row level security;
alter table servidores.cargos enable row level security;
alter table servidores.regimes_vinculo enable row level security;
alter table servidores.lotacoes_funcionais enable row level security;
alter table organizacional.tipos_unidade enable row level security;

create policy "pessoas_select"
on servidores.pessoas for select to authenticated
using (
  public.current_user_has_permission('servidores:read')
  or public.current_user_has_permission('usuarios:manage')
  or exists (
    select 1 from app_auth.usuarios u
    where u.id = (select auth.uid()) and u.pessoa_id = pessoas.id
  )
  or exists (
    select 1 from servidores.servidores s
    where s.pessoa_id = pessoas.id and public.current_user_can_access_servidor(s.id)
  )
);
create policy "pessoas_insert"
on servidores.pessoas for insert to authenticated
with check (
  public.current_user_has_permission('servidores:write')
  or public.current_user_has_permission('usuarios:manage')
);
create policy "pessoas_update"
on servidores.pessoas for update to authenticated
using (
  public.current_user_has_permission('servidores:write')
  or public.current_user_has_permission('usuarios:manage')
)
with check (
  public.current_user_has_permission('servidores:write')
  or public.current_user_has_permission('usuarios:manage')
);
create policy "pessoas_delete"
on servidores.pessoas for delete to authenticated
using (public.current_user_has_permission('servidores:delete'));

create policy "cargos_select" on servidores.cargos
for select to authenticated using (true);
create policy "cargos_insert" on servidores.cargos
for insert to authenticated with check (public.current_user_has_permission('servidores:write'));
create policy "cargos_update" on servidores.cargos
for update to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));
create policy "cargos_delete" on servidores.cargos
for delete to authenticated using (public.current_user_has_permission('servidores:delete'));

create policy "regimes_vinculo_select" on servidores.regimes_vinculo
for select to authenticated using (true);
create policy "regimes_vinculo_insert" on servidores.regimes_vinculo
for insert to authenticated with check (public.current_user_has_permission('servidores:write'));
create policy "regimes_vinculo_update" on servidores.regimes_vinculo
for update to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));
create policy "regimes_vinculo_delete" on servidores.regimes_vinculo
for delete to authenticated using (public.current_user_has_permission('servidores:delete'));

create policy "lotacoes_funcionais_select"
on servidores.lotacoes_funcionais for select to authenticated
using (
  exists (
    select 1 from servidores.vinculos_funcionais vf
    where vf.id = lotacoes_funcionais.vinculo_funcional_id
      and public.current_user_can_access_servidor(vf.servidor_id)
  )
);
create policy "lotacoes_funcionais_insert" on servidores.lotacoes_funcionais
for insert to authenticated with check (public.current_user_has_permission('servidores:write'));
create policy "lotacoes_funcionais_update" on servidores.lotacoes_funcionais
for update to authenticated
using (public.current_user_has_permission('servidores:write'))
with check (public.current_user_has_permission('servidores:write'));
create policy "lotacoes_funcionais_delete" on servidores.lotacoes_funcionais
for delete to authenticated using (public.current_user_has_permission('servidores:delete'));

create policy "tipos_unidade_select" on organizacional.tipos_unidade
for select to authenticated using (true);
create policy "tipos_unidade_insert" on organizacional.tipos_unidade
for insert to authenticated with check (public.current_user_has_permission('unidades:manage'));
create policy "tipos_unidade_update" on organizacional.tipos_unidade
for update to authenticated
using (public.current_user_has_permission('unidades:manage'))
with check (public.current_user_has_permission('unidades:manage'));
create policy "tipos_unidade_delete" on organizacional.tipos_unidade
for delete to authenticated using (public.current_user_has_permission('unidades:manage'));

grant select, insert, update, delete on servidores.pessoas to authenticated;
grant select, insert, update, delete on servidores.cargos to authenticated;
grant select, insert, update, delete on servidores.regimes_vinculo to authenticated;
grant select, insert, update, delete on servidores.lotacoes_funcionais to authenticated;
grant select, insert, update, delete on organizacional.tipos_unidade to authenticated;

-- Remove duplicate and misplaced data only after dependencies use the new model.
alter table medicos.medicos drop column usuario_id;
alter table medicos.medico_unidades rename to locais_atendimento;

alter table afastamentos.afastamentos drop column prontuario_id;

alter table app_auth.usuarios
  drop column nome_completo,
  drop column cpf;

alter table servidores.vinculos_funcionais
  drop column tipo_vinculo,
  drop column cargo,
  drop column unidade_id;

alter table servidores.servidores
  drop column matricula,
  drop column nome,
  drop column cpf,
  drop column cargo,
  drop column data_admissao,
  drop column unidade_id;

alter table organizacional.unidades drop column tipo;

revoke all on function public.current_user_can_access_servidor(uuid) from public, anon;
revoke all on function public.list_servidores_for_afastamentos(uuid[]) from public, anon;
revoke all on function public.get_servidores_resumo_for_afastamentos(uuid[]) from public, anon;
revoke all on function servidores.validar_setor_lotacao() from public, anon, authenticated;
grant execute on function public.current_user_can_access_servidor(uuid) to authenticated;
grant execute on function public.list_servidores_for_afastamentos(uuid[]) to authenticated;
grant execute on function public.get_servidores_resumo_for_afastamentos(uuid[]) to authenticated;

comment on schema servidores is
  'Identidade civil, cadastro de servidores, cargos, regimes, vínculos, lotações e prontuários.';
comment on table servidores.pessoas is
  'Identidade civil compartilhada por usuários da aplicação e servidores.';
comment on table servidores.servidores is
  'Cadastro institucional de uma pessoa como servidor, sem dados de vínculo ou lotação.';
comment on table servidores.vinculos_funcionais is
  'Relação jurídica entre servidor e município, com matrícula e regime.';
comment on table servidores.lotacoes_funcionais is
  'Histórico de cargo, unidade e setor ocupados em cada vínculo funcional.';
