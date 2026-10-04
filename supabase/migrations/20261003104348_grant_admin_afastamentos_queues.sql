insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
cross join app_auth.permissoes pe
where p.nome = 'administrador'
	and (pe.recurso, pe.acao) in (('cas', 'fila'), ('rh', 'fila'))
on conflict (perfil_id, permissao_id) do nothing;
