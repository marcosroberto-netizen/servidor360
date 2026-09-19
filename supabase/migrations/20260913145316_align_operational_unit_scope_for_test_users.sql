with expected_scope(email, unidade_nome) as (
  values
    ('cas@servidor360.local', 'Complexo CAS'),
    ('rh@servidor360.local', 'Departamento de Pessoal'),
    ('educacao@servidor360.local', 'Secretaria Municipal de Educação')
),
target_users as (
  select u.id as usuario_id, es.unidade_nome
  from app_auth.usuarios u
  join expected_scope es on es.email = u.email
),
target_units as (
  select tu.usuario_id, un.id as unidade_id
  from target_users tu
  join organizacional.unidades un on un.nome = tu.unidade_nome
)
delete from app_auth.usuario_unidades uu
using target_users tu
where uu.usuario_id = tu.usuario_id
  and not exists (
    select 1
    from target_units expected
    where expected.usuario_id = uu.usuario_id
      and expected.unidade_id = uu.unidade_id
  );

with expected_scope(email, unidade_nome) as (
  values
    ('cas@servidor360.local', 'Complexo CAS'),
    ('rh@servidor360.local', 'Departamento de Pessoal'),
    ('educacao@servidor360.local', 'Secretaria Municipal de Educação')
)
insert into app_auth.usuario_unidades (usuario_id, unidade_id)
select u.id, un.id
from expected_scope es
join app_auth.usuarios u on u.email = es.email
join organizacional.unidades un on un.nome = es.unidade_nome
on conflict (usuario_id, unidade_id) do nothing;
