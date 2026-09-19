alter table servidores.funcoes
  add column cargo_referencia_id uuid
    references servidores.cargos(id) on delete restrict;

update servidores.funcoes f
set cargo_referencia_id = c.id
from servidores.cargos c
where f.codigo = 'administrativo'
  and c.nome = 'Agente Administrativo';

alter table servidores.funcoes
  alter column cargo_referencia_id set not null;

create index funcoes_cargo_referencia_id_idx
on servidores.funcoes (cargo_referencia_id);

comment on column servidores.funcoes.cargo_referencia_id is
  'Cargo oficial da prefeitura usado como referência para a função.';
comment on table servidores.funcoes is
  'Funções exercidas temporariamente, sempre vinculadas a um cargo oficial de referência.';
