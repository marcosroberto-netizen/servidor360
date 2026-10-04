create or replace function public.responder_complementacao_afastamento(
	target_afastamento_id uuid,
	resposta text,
	documento_nome text default null,
	documento_url text default null
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
declare
	current_status text;
	target_complementacao_id uuid;
begin
	if (select auth.uid()) is null then
		raise exception 'Usuario nao autenticado';
	end if;

	if not public.current_user_has_permission('afastamentos:complementar') then
		raise exception 'Usuario sem permissao para complementar afastamento';
	end if;

	if not public.current_user_can_access_afastamento(target_afastamento_id) then
		raise exception 'Afastamento nao encontrado ou fora do escopo permitido';
	end if;

	if nullif(btrim(responder_complementacao_afastamento.resposta), '') is null then
		raise exception 'Resposta da complementacao e obrigatoria';
	end if;

	select a.status into current_status
	from afastamentos.afastamentos a
	where a.id = target_afastamento_id;

	if current_status <> 'aguardando_complementacao' then
		raise exception 'Afastamento nao esta aguardando complementacao';
	end if;

	select c.id into target_complementacao_id
	from afastamentos.complementacoes c
	where c.afastamento_id = target_afastamento_id
		and c.status = 'pendente'
	order by c.solicitada_em desc
	limit 1;

	if target_complementacao_id is null then
		raise exception 'Complementacao pendente nao encontrada';
	end if;

	update afastamentos.complementacoes
	set
		resposta = nullif(btrim(responder_complementacao_afastamento.resposta), ''),
		documento_nome = nullif(btrim(responder_complementacao_afastamento.documento_nome), ''),
		documento_url = nullif(btrim(responder_complementacao_afastamento.documento_url), ''),
		respondida_por = (select auth.uid()),
		respondida_em = now(),
		status = 'respondida'
	where id = target_complementacao_id;

	update afastamentos.afastamentos
	set status = 'aguardando_analise', updated_at = now()
	where id = target_afastamento_id;

	perform afastamentos.add_movimentacao(
		target_afastamento_id,
		'complementacao',
		'Complementacao respondida',
		nullif(btrim(responder_complementacao_afastamento.resposta), ''),
		current_status,
		'aguardando_analise',
		'publica'
	);
end;
$$;

revoke all on function public.responder_complementacao_afastamento(uuid, text, text, text)
from public, anon;
grant execute on function public.responder_complementacao_afastamento(uuid, text, text, text)
to authenticated;

comment on function public.responder_complementacao_afastamento(uuid, text, text, text) is
	'Responde a complementacao pendente de um afastamento acessivel ao usuario, registra historico e retorna o processo para analise CAS.';
