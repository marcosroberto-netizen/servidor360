create function public.get_movimentacoes_afastamento(target_afastamento_id uuid)
returns table (
  id uuid,
  tipo text,
  titulo text,
  descricao text,
  status_origem text,
  status_destino text,
  criado_por uuid,
  criado_por_nome text,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = afastamentos, app_auth, servidores, public, auth
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  if not public.current_user_can_access_afastamento(target_afastamento_id) then
    raise exception 'Processo fora do escopo permitido';
  end if;

  return query
  select
    m.id,
    m.tipo,
    m.titulo,
    m.descricao,
    m.status_origem,
    m.status_destino,
    m.criado_por,
    p.nome_completo,
    m.criado_em
  from afastamentos.movimentacoes m
  left join app_auth.usuarios u on u.id = m.criado_por
  left join servidores.pessoas p on p.id = u.pessoa_id
  where m.afastamento_id = target_afastamento_id
    and (
      m.visibilidade <> 'ocupacional'
      or public.current_user_can_access_ocupacional()
    )
  order by m.criado_em desc;
end;
$$;

revoke all on function public.get_movimentacoes_afastamento(uuid)
from public, anon;
grant execute on function public.get_movimentacoes_afastamento(uuid)
to authenticated;

comment on function public.get_movimentacoes_afastamento(uuid) is
  'Lista movimentacoes visiveis do processo com o nome do usuario responsavel.';
