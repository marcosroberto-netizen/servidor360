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
    s.nome,
    s.matricula,
    s.cpf,
    s.cargo,
    s.unidade_id,
    u.nome as unidade_nome,
    s.ativo
  from servidores.servidores s
  join afastamentos.afastamentos a on a.servidor_id = s.id
  left join organizacional.unidades u on u.id = s.unidade_id
  where auth.uid() is not null
    and s.id = any(servidor_ids)
    and public.current_user_can_access_afastamento(a.id);
$$;

revoke all on function public.get_servidores_resumo_for_afastamentos(uuid[]) from public;
revoke all on function public.get_servidores_resumo_for_afastamentos(uuid[]) from anon;
grant execute on function public.get_servidores_resumo_for_afastamentos(uuid[]) to authenticated;
