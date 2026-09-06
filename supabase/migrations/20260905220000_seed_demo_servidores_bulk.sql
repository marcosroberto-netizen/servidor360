with escolas as (
  select
    id,
    nome,
    row_number() over (order by nome) as escola_ordem,
    count(*) over () as total_escolas
  from organizacional.unidades
  where tipo = 'escola'
    and ativo
),
nomes as (
  select *
  from (
    values
      (1, 'Adriana Souza Ribeiro', 'Professora de Ensino Fundamental'),
      (2, 'Aline Cristina Moraes', 'Professora de Educacao Infantil'),
      (3, 'Amanda Freitas Lopes', 'Auxiliar de Desenvolvimento Infantil'),
      (4, 'Andre Luiz Carvalho', 'Professor de Matematica'),
      (5, 'Angela Maria Duarte', 'Merendeira Escolar'),
      (6, 'Beatriz Nunes Almeida', 'Professora de Portugues'),
      (7, 'Bruno Henrique Martins', 'Inspetor de Alunos'),
      (8, 'Camila Torres Campos', 'Coordenadora Pedagogica'),
      (9, 'Carla Regina Batista', 'Professora de Ciencias'),
      (10, 'Cecilia Barbosa Prado', 'Secretaria Escolar'),
      (11, 'Daniel Rocha Ferreira', 'Professor de Historia'),
      (12, 'Daniela Gomes Vieira', 'Professora de Geografia'),
      (13, 'Diego Fernandes Lima', 'Agente Administrativo Escolar'),
      (14, 'Elaine Aparecida Costa', 'Professora de Arte'),
      (15, 'Elisa Moreira Cardoso', 'Orientadora Educacional'),
      (16, 'Fabiana Ribeiro Santos', 'Professora de Ensino Fundamental'),
      (17, 'Felipe Augusto Mendes', 'Professor de Educacao Fisica'),
      (18, 'Fernanda Paula Teixeira', 'Auxiliar de Secretaria'),
      (19, 'Gabriel Henrique Alves', 'Professor de Ingles'),
      (20, 'Gabriela Oliveira Neves', 'Professora de Educacao Infantil'),
      (21, 'Helena Martins Correia', 'Diretora Escolar'),
      (22, 'Igor Santana Reis', 'Inspetor de Alunos'),
      (23, 'Isabela Lima Araujo', 'Professora de Ensino Fundamental'),
      (24, 'Joao Pedro Farias', 'Professor de Matematica'),
      (25, 'Juliana Castro Melo', 'Professora de Portugues'),
      (26, 'Karen Azevedo Pinto', 'Auxiliar de Desenvolvimento Infantil'),
      (27, 'Larissa Fernandes Moura', 'Professora de Ciencias'),
      (28, 'Leonardo Batista Ramos', 'Professor de Historia'),
      (29, 'Leticia Gomes Peixoto', 'Coordenadora Pedagogica'),
      (30, 'Lucas Henrique Barros', 'Agente Administrativo Escolar'),
      (31, 'Marcela Tavares Dias', 'Professora de Geografia'),
      (32, 'Marcos Vinicius Leal', 'Professor de Educacao Fisica'),
      (33, 'Maria Eduarda Cunha', 'Professora de Ensino Fundamental'),
      (34, 'Natalia Barbosa Lima', 'Secretaria Escolar'),
      (35, 'Otavio Henrique Nascimento', 'Professor de Ingles'),
      (36, 'Patricia Araujo Campos', 'Professora de Arte'),
      (37, 'Paulo Roberto Macedo', 'Inspetor de Alunos'),
      (38, 'Priscila Mendes Rocha', 'Professora de Educacao Infantil'),
      (39, 'Rafaela Silva Monteiro', 'Orientadora Educacional'),
      (40, 'Renan Costa Amaral', 'Professor de Matematica'),
      (41, 'Renata Cristina Pires', 'Professora de Portugues'),
      (42, 'Ricardo Almeida Soares', 'Agente Administrativo Escolar'),
      (43, 'Sabrina Oliveira Duarte', 'Professora de Ciencias'),
      (44, 'Samuel Cardoso Nunes', 'Professor de Historia'),
      (45, 'Simone Batista Freire', 'Auxiliar de Secretaria'),
      (46, 'Tatiane Ribeiro Machado', 'Professora de Ensino Fundamental'),
      (47, 'Thiago Martins Lopes', 'Professor de Educacao Fisica'),
      (48, 'Vanessa Gomes Martins', 'Professora de Geografia'),
      (49, 'Vinicius Santos Pereira', 'Inspetor de Alunos'),
      (50, 'Viviane Azevedo Ramos', 'Merendeira Escolar')
  ) as base(ordem, nome, cargo)
),
demo_servidores as (
  select
    'EDU-' || lpad((20000 + gs.numero)::text, 5, '0') as matricula,
    nomes.nome as nome,
    lpad((70000000000 + gs.numero)::text, 11, '0') as cpf,
    nomes.cargo,
    date '2014-01-01' + ((gs.numero * 23) % 3650) as data_admissao,
    escolas.id as unidade_id
  from (
    select
      numero,
      ((numero - 1) % 50) + 1 as nome_ordem,
      ((numero - 1) / 50) + 1 as rodada,
      ((numero - 1) % greatest((select count(*) from escolas), 1)) + 1 as escola_ordem
    from generate_series(1, 120) as serie(numero)
  ) gs
  join nomes on nomes.ordem = gs.nome_ordem
  join escolas on escolas.escola_ordem = gs.escola_ordem
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
    matricula,
    nome,
    cpf,
    cargo,
    data_admissao,
    unidade_id,
    true
  from demo_servidores
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
