delete from public.perfil_permissoes pp
using public.perfis p, public.permissoes pe
where pp.perfil_id = p.id
  and pp.permissao_id = pe.id
  and p.nome = 'gestor_escolar'
  and (pe.recurso, pe.acao) in (
    ('servidores', 'read'),
    ('documentos', 'read'),
    ('documentos', 'write'),
    ('documentos_funcionais', 'read')
  );
