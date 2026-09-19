insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
join app_auth.permissoes pe on pe.recurso = 'afastamentos' and pe.acao = 'create'
where p.nome in ('educacao', 'cas', 'rh')
on conflict (perfil_id, permissao_id) do nothing;

drop policy if exists "servidores_select_by_permission_scope" on servidores.servidores;
create policy "servidores_select_by_permission_scope"
on servidores.servidores for select
to authenticated
using (
  public.current_user_has_permission('servidores:read')
  or (
    public.current_user_has_permission('afastamentos:create')
    and public.current_user_has_unidade(unidade_id)
  )
);

drop policy if exists "prontuarios_select_by_servidor_scope" on servidores.prontuarios;
create policy "prontuarios_select_by_servidor_scope"
on servidores.prontuarios for select
to authenticated
using (
  public.current_user_has_permission('prontuario:read')
  or exists (
    select 1
    from servidores.servidores s
    where s.id = prontuarios.servidor_id
      and public.current_user_has_permission('afastamentos:create')
      and public.current_user_has_unidade(s.unidade_id)
  )
);

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

  if not public.current_user_has_unidade(servidor_unidade_id) then
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

drop policy if exists "afastamentos_insert_by_servidor_scope" on afastamentos.afastamentos;
create policy "afastamentos_insert_by_servidor_scope"
on afastamentos.afastamentos for insert
to authenticated
with check (
  public.current_user_has_permission('afastamentos:create')
  and iniciado_por = auth.uid()
  and exists (
    select 1
    from servidores.servidores s
    where s.id = afastamentos.servidor_id
      and public.current_user_has_unidade(s.unidade_id)
  )
);

insert into organizacional.unidades (nome, tipo)
select unidade.nome, unidade.tipo
from (
  values
    ('Complexo CAS', 'departamento'),
    ('Departamento de Pessoal', 'departamento')
) as unidade(nome, tipo)
where not exists (
  select 1
  from organizacional.unidades existing
  where existing.nome = unidade.nome
);

with demo_servidores(matricula, nome, cpf, cargo, data_admissao, unidade_nome) as (
  values
    ('CAS-30001', 'Amanda Cristina Melo', '81100000001', 'Psicologa', date '2018-03-12', 'Complexo CAS'),
    ('CAS-30002', 'Bruno Henrique Alves', '81100000002', 'Assistente Social', date '2017-08-21', 'Complexo CAS'),
    ('CAS-30003', 'Camila Torres Nunes', '81100000003', 'Terapeuta Ocupacional', date '2019-01-14', 'Complexo CAS'),
    ('CAS-30004', 'Daniel Rocha Lima', '81100000004', 'Agente Administrativo', date '2020-06-01', 'Complexo CAS'),
    ('CAS-30005', 'Elaine Ribeiro Santos', '81100000005', 'Enfermeira', date '2016-11-07', 'Complexo CAS'),
    ('CAS-30006', 'Felipe Augusto Martins', '81100000006', 'Medico Perito', date '2015-04-27', 'Complexo CAS'),
    ('CAS-30007', 'Gabriela Oliveira Prado', '81100000007', 'Fonoaudiologa', date '2021-09-13', 'Complexo CAS'),
    ('CAS-30008', 'Igor Santana Moraes', '81100000008', 'Agente Administrativo', date '2022-02-18', 'Complexo CAS'),
    ('CAS-30009', 'Juliana Castro Freitas', '81100000009', 'Psicopedagoga', date '2014-10-06', 'Complexo CAS'),
    ('CAS-30010', 'Lucas Henrique Barbosa', '81100000010', 'Coordenador Tecnico', date '2013-05-20', 'Complexo CAS'),
    ('DP-31001', 'Mariana Lima Duarte', '81200000001', 'Analista de Recursos Humanos', date '2016-02-15', 'Departamento de Pessoal'),
    ('DP-31002', 'Rafael Oliveira Campos', '81200000002', 'Assistente Administrativo', date '2018-07-09', 'Departamento de Pessoal'),
    ('DP-31003', 'Renata Cristina Pires', '81200000003', 'Tecnica de Recursos Humanos', date '2019-12-02', 'Departamento de Pessoal'),
    ('DP-31004', 'Samuel Cardoso Nunes', '81200000004', 'Coordenador de Pessoal', date '2014-04-16', 'Departamento de Pessoal'),
    ('DP-31005', 'Vanessa Gomes Martins', '81200000005', 'Agente Administrativo', date '2021-01-25', 'Departamento de Pessoal'),
    ('SME-32001', 'Adriana Souza Ribeiro', '81300000001', 'Assessora Pedagogica', date '2015-03-30', 'Secretaria Municipal de Educação'),
    ('SME-32002', 'Andre Luiz Carvalho', '81300000002', 'Supervisor de Ensino', date '2017-05-11', 'Secretaria Municipal de Educação'),
    ('SME-32003', 'Beatriz Nunes Almeida', '81300000003', 'Coordenadora de Projetos', date '2018-09-04', 'Secretaria Municipal de Educação'),
    ('SME-32004', 'Daniela Gomes Vieira', '81300000004', 'Tecnica Administrativa', date '2020-10-19', 'Secretaria Municipal de Educação'),
    ('SME-32005', 'Patricia Araujo Campos', '81300000005', 'Diretora de Departamento', date '2013-07-08', 'Secretaria Municipal de Educação')
),
inserted_servidores as (
  insert into servidores.servidores (
    matricula,
    nome,
    cpf,
    cargo,
    data_admissao,
    unidade_id,
    ativo
  )
  select
    ds.matricula,
    ds.nome,
    ds.cpf,
    ds.cargo,
    ds.data_admissao,
    u.id,
    true
  from demo_servidores ds
  join organizacional.unidades u on u.nome = ds.unidade_nome
  on conflict (matricula) do update
  set
    nome = excluded.nome,
    cpf = excluded.cpf,
    cargo = excluded.cargo,
    data_admissao = excluded.data_admissao,
    unidade_id = excluded.unidade_id,
    ativo = excluded.ativo
  returning id
)
insert into servidores.prontuarios (servidor_id)
select id
from inserted_servidores
on conflict (servidor_id) do nothing;

with scoped_users(email, unidade_nome) as (
  values
    ('cas@servidor360.local', 'Complexo CAS'),
    ('rh@servidor360.local', 'Departamento de Pessoal'),
    ('educacao@servidor360.local', 'Secretaria Municipal de Educação')
)
insert into app_auth.usuario_unidades (usuario_id, unidade_id)
select u.id, un.id
from scoped_users su
join app_auth.usuarios u on u.email = su.email
join organizacional.unidades un on un.nome = su.unidade_nome
on conflict (usuario_id, unidade_id) do nothing;
