with demo_servidores(matricula, nome, cpf, cargo, data_admissao, unidade_nome) as (
  values
    ('EDU-10021', 'Ana Paula Martins', '34821098711', 'Professora de Ensino Fundamental', date '2017-02-06', 'EMEF Professora Maria Helena'),
    ('EDU-10022', 'Carlos Eduardo Santos', '92177433620', 'Agente Administrativo Escolar', date '2019-08-12', 'EMEF Professora Maria Helena'),
    ('EDU-10023', 'Mariana Lima Rocha', '50711844203', 'Coordenadora Pedagogica', date '2015-03-02', 'CMEI Pequenos Saberes'),
    ('EDU-10024', 'Roberto Alves Pereira', '64290177584', 'Professor de Educacao Infantil', date '2021-01-18', 'CMEI Pequenos Saberes'),
    ('EDU-10025', 'Patricia Gomes Nascimento', '73540911865', 'Auxiliar de Desenvolvimento Infantil', date '2018-05-21', 'Escola Municipal Modelo'),
    ('EDU-10026', 'Fernando Henrique Costa', '28465099317', 'Inspetor de Alunos', date '2020-09-14', 'Escola Municipal Modelo'),
    ('EDU-10027', 'Luciana Ferreira Batista', '11938455792', 'Professora de Arte', date '2016-07-25', 'EMEF Professora Maria Helena'),
    ('EDU-10028', 'Rafael Oliveira Mendes', '88420166355', 'Professor de Educacao Fisica', date '2022-02-01', 'CMEI Pequenos Saberes')
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
