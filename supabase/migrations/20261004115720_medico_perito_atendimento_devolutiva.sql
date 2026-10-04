insert into app_auth.permissoes (nome, recurso, acao)
values
	('Avaliar afastamentos', 'afastamentos', 'avaliar'),
	('Gerar documento digital de afastamento', 'afastamentos', 'gerar_documento'),
	('Assinar documento digital de afastamento', 'afastamentos', 'assinar_documento'),
	('Visualizar documento de afastamento', 'afastamentos', 'visualizar_documento')
on conflict (recurso, acao) do update
set nome = excluded.nome;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
cross join app_auth.permissoes pe
where p.nome = 'medico'
	and (pe.recurso, pe.acao) in (
		('afastamentos', 'avaliar'),
		('afastamentos', 'emitir_devolutiva'),
		('afastamentos', 'gerar_documento'),
		('afastamentos', 'assinar_documento'),
		('afastamentos', 'visualizar_documento')
	)
on conflict (perfil_id, permissao_id) do nothing;

delete from app_auth.perfil_permissoes pp
using app_auth.perfis p, app_auth.permissoes pe
where pp.perfil_id = p.id
	and pp.permissao_id = pe.id
	and p.nome = 'medico'
	and pe.recurso = 'afastamentos'
	and pe.acao = 'read';

alter table afastamentos.devolutivas
	add column if not exists detalhes jsonb not null default '{}'::jsonb;

alter table afastamentos.devolutivas
	drop constraint if exists devolutivas_resultado_check;

alter table afastamentos.devolutivas
	add constraint devolutivas_resultado_check check (
		resultado in (
			'apto',
			'afastado',
			'inapto',
			'apto_com_restricoes',
			'nova_avaliacao',
			'complementacao',
			'outra'
		)
	);

create or replace function public.list_minhas_avaliacoes_afastamento()
returns table (
	id uuid,
	servidor_id uuid,
	vinculo_funcional_id uuid,
	status text,
	protocolo text,
	tipo text,
	data_inicio date,
	data_fim date,
	motivo text,
	observacoes text,
	documento_origem_nome text,
	documento_origem_tipo text,
	iniciado_em timestamptz,
	encaminhado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = afastamentos, app_auth, public, auth
as $$
begin
	if (select auth.uid()) is null then
		raise exception 'Usuario nao autenticado';
	end if;

	if not public.current_user_has_permission('afastamentos:avaliar')
		and not public.current_user_has_permission('afastamentos:emitir_devolutiva') then
		raise exception 'Usuario sem permissao para consultar avaliacoes';
	end if;

	return query
	select
		a.id,
		a.servidor_id,
		a.vinculo_funcional_id,
		a.status,
		a.protocolo,
		a.tipo,
		a.data_inicio,
		a.data_fim,
		a.motivo,
		a.observacoes,
		a.documento_origem_nome,
		a.documento_origem_tipo,
		a.iniciado_em,
		am.encaminhado_em
	from afastamentos.avaliacoes_medicas am
	join afastamentos.avaliadores av on av.id = am.avaliador_id
	join afastamentos.afastamentos a on a.id = am.afastamento_id
	where av.usuario_id = (select auth.uid())
		and am.status = 'pendente'
		and a.status = 'aguardando_avaliacao'
	order by am.encaminhado_em asc;
end;
$$;

create or replace function public.emitir_devolutiva_afastamento(
	target_afastamento_id uuid,
	resultado text,
	descricao text,
	orientacoes text default null,
	encaminhar_rh boolean default true,
	detalhes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = afastamentos, app_auth, public, auth
as $$
declare
	current_status text;
	next_status text;
	assigned_user_id uuid;
	normalized_resultado text;
	normalized_descricao text;
	normalized_orientacoes text;
	normalized_detalhes jsonb;
begin
	if (select auth.uid()) is null then
		raise exception 'Usuario nao autenticado';
	end if;

	if not public.current_user_has_permission('afastamentos:emitir_devolutiva')
		and not public.current_user_has_permission('afastamentos:avaliar') then
		raise exception 'Usuario sem permissao para emitir devolutiva';
	end if;

	normalized_resultado := nullif(btrim(emitir_devolutiva_afastamento.resultado), '');
	normalized_descricao := nullif(btrim(emitir_devolutiva_afastamento.descricao), '');
	normalized_orientacoes := nullif(btrim(emitir_devolutiva_afastamento.orientacoes), '');
	normalized_detalhes := coalesce(emitir_devolutiva_afastamento.detalhes, '{}'::jsonb);

	if normalized_resultado is null then
		raise exception 'Devolutiva obrigatoria';
	end if;

	if normalized_resultado not in ('apto', 'afastado', 'inapto', 'apto_com_restricoes', 'nova_avaliacao', 'complementacao', 'outra') then
		raise exception 'Devolutiva invalida';
	end if;

	if normalized_descricao is null then
		raise exception 'Observacoes do atendimento sao obrigatorias';
	end if;

	if normalized_resultado in ('afastado', 'inapto') then
		if nullif(btrim(normalized_detalhes #>> '{afastamento,periodo,inicio}'), '') is null
			or nullif(btrim(normalized_detalhes #>> '{afastamento,periodo,fim}'), '') is null then
			raise exception 'Periodo do afastamento e obrigatorio';
		end if;
	end if;

	if normalized_resultado = 'apto_com_restricoes' then
		if nullif(btrim(normalized_detalhes #>> '{restricao,descricao}'), '') is null
			or nullif(btrim(normalized_detalhes #>> '{restricao,periodo,inicio}'), '') is null
			or nullif(btrim(normalized_detalhes #>> '{restricao,periodo,fim}'), '') is null then
			raise exception 'Restricoes e periodo sao obrigatorios';
		end if;
	end if;

	if normalized_resultado = 'complementacao' and normalized_orientacoes is null then
		raise exception 'Informe a complementacao necessaria';
	end if;

	select status into current_status
	from afastamentos.afastamentos
	where id = target_afastamento_id;

	if current_status is null then
		raise exception 'Afastamento nao encontrado';
	end if;

	if current_status <> 'aguardando_avaliacao' then
		raise exception 'Afastamento nao esta aguardando avaliacao';
	end if;

	select av.usuario_id into assigned_user_id
	from afastamentos.avaliacoes_medicas am
	join afastamentos.avaliadores av on av.id = am.avaliador_id
	where am.afastamento_id = target_afastamento_id
		and am.status = 'pendente';

	if assigned_user_id is null then
		raise exception 'Avaliador pendente nao encontrado';
	end if;

	if assigned_user_id <> (select auth.uid())
		and not public.current_user_has_role('administrador') then
		raise exception 'A avaliacao esta atribuida a outro avaliador';
	end if;

	next_status := case
		when normalized_resultado = 'complementacao' then 'aguardando_complementacao'
		when encaminhar_rh then 'aguardando_rh'
		else 'avaliado'
	end;

	insert into afastamentos.devolutivas (
		afastamento_id,
		resultado,
		descricao,
		orientacoes,
		detalhes,
		responsavel_id,
		visibilidade
	) values (
		target_afastamento_id,
		normalized_resultado,
		normalized_descricao,
		normalized_orientacoes,
		normalized_detalhes,
		(select auth.uid()),
		'restrita'
	);

	if normalized_resultado = 'complementacao' then
		insert into afastamentos.complementacoes (
			afastamento_id,
			solicitacao,
			solicitada_por
		) values (
			target_afastamento_id,
			normalized_orientacoes,
			(select auth.uid())
		);

		update afastamentos.avaliacoes_medicas
		set status = 'cancelada'
		where afastamento_id = target_afastamento_id and status = 'pendente';
	else
		update afastamentos.avaliacoes_medicas
		set status = 'concluida', concluido_em = now()
		where afastamento_id = target_afastamento_id and status = 'pendente';
	end if;

	update afastamentos.afastamentos
	set status = next_status, updated_at = now()
	where id = target_afastamento_id;

	perform afastamentos.add_movimentacao(
		target_afastamento_id,
		'devolutiva',
		case
			when normalized_resultado = 'complementacao' then 'Complementacao solicitada pelo avaliador'
			else 'Devolutiva emitida'
		end,
		coalesce(normalized_orientacoes, normalized_descricao),
		current_status,
		next_status,
		'restrita'
	);
end;
$$;

revoke all on function public.list_minhas_avaliacoes_afastamento()
from public, anon;
grant execute on function public.list_minhas_avaliacoes_afastamento()
to authenticated;

revoke all on function public.emitir_devolutiva_afastamento(uuid, text, text, text, boolean)
from public, anon, authenticated;
revoke all on function public.emitir_devolutiva_afastamento(uuid, text, text, text, boolean, jsonb)
from public, anon;
grant execute on function public.emitir_devolutiva_afastamento(uuid, text, text, text, boolean, jsonb)
to authenticated;

comment on function public.list_minhas_avaliacoes_afastamento() is
	'Lista somente avaliacoes pendentes atribuidas ao avaliador autenticado.';

comment on function public.emitir_devolutiva_afastamento(uuid, text, text, text, boolean, jsonb) is
	'Registra atendimento de avaliador autorizado, valida campos da devolutiva, historiza e atualiza o fluxo do afastamento.';
