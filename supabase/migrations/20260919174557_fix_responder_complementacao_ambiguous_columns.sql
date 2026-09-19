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
	if not public.current_user_has_permission('afastamentos:complementar') then
		raise exception 'Usuario sem permissao para complementar afastamento';
	end if;

	select status into current_status
	from afastamentos.afastamentos
	where id = target_afastamento_id;

	if current_status <> 'aguardando_complementacao' then
		raise exception 'Afastamento nao esta aguardando complementacao';
	end if;

	select id into target_complementacao_id
	from afastamentos.complementacoes
	where afastamento_id = target_afastamento_id
		and status = 'pendente'
	order by solicitada_em desc
	limit 1;

	if target_complementacao_id is null then
		raise exception 'Complementacao pendente nao encontrada';
	end if;

	update afastamentos.complementacoes
	set
		resposta = nullif(responder_complementacao_afastamento.resposta, ''),
		documento_nome = nullif(responder_complementacao_afastamento.documento_nome, ''),
		documento_url = nullif(responder_complementacao_afastamento.documento_url, ''),
		respondida_por = auth.uid(),
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
		responder_complementacao_afastamento.resposta,
		current_status,
		'aguardando_analise',
		'publica'
	);
end;
$$;
