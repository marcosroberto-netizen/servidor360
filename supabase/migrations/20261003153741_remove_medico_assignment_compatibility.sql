do $$
begin
	if exists (
		select 1
		from afastamentos.avaliacoes_medicas
		where avaliador_id is null
	) then
		raise exception 'Nao e possivel remover medico_id: existem avaliacoes sem avaliador_id';
	end if;
end;
$$;

drop function if exists public.registrar_triagem_afastamento(
	uuid, text, text, text, text, uuid, boolean
);
drop function if exists public.registrar_triagem_afastamento(
	uuid, text, text, text, text, uuid
);
drop function if exists public.list_medicos_para_avaliacao();

drop policy if exists "avaliacoes_medicas_select_authorized"
on afastamentos.avaliacoes_medicas;
drop index if exists afastamentos.avaliacoes_medicas_medico_fila_idx;
alter table afastamentos.avaliacoes_medicas drop column medico_id;

create policy "avaliacoes_medicas_select_authorized"
on afastamentos.avaliacoes_medicas for select
to authenticated
using (
	public.current_user_has_permission('afastamentos:analisar')
	or public.current_user_has_role('administrador')
	or exists (
		select 1
		from afastamentos.avaliadores av
		where av.id = avaliador_id
			and av.usuario_id = (select auth.uid())
	)
);

create or replace function public.current_user_can_access_afastamento(afastamento_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = afastamentos, servidores, public, auth
as $$
	select (select auth.uid()) is not null
		and exists (
			select 1
			from afastamentos.afastamentos a
			where a.id = afastamento_uuid
				and (
					public.current_user_has_permission('afastamentos:read')
					or exists (
						select 1
						from afastamentos.avaliacoes_medicas am
						join afastamentos.avaliadores av on av.id = am.avaliador_id
						where am.afastamento_id = a.id
							and am.status = 'pendente'
							and av.usuario_id = (select auth.uid())
					)
					or (
						public.current_user_has_permission('afastamentos:create')
						and exists (
							select 1
							from servidores.lotacoes_funcionais lf
							where lf.vinculo_funcional_id = a.vinculo_funcional_id
								and lf.ativo
								and public.current_user_has_unidade(lf.unidade_id)
						)
					)
				)
		);
$$;

create or replace function public.encaminhar_avaliacao_afastamento(
	target_afastamento_id uuid,
	target_avaliador_id uuid,
	comentarios text,
	permitir_reatribuicao boolean default false
)
returns void
language plpgsql
security definer
set search_path = afastamentos, servidores, app_auth, public, auth
as $$
declare
	current_status text;
	current_assignment_id uuid;
	current_avaliador_id uuid;
	target_user_id uuid;
	target_nome text;
	current_nome text;
begin
	if not public.current_user_has_permission('afastamentos:analisar')
		or not public.current_user_has_permission('afastamentos:encaminhar_avaliacao') then
		raise exception 'Usuario sem permissao para encaminhar avaliacao';
	end if;

	if nullif(btrim(comentarios), '') is null then
		raise exception 'A justificativa do encaminhamento ou reatribuicao e obrigatoria';
	end if;

	select status into current_status
	from afastamentos.afastamentos
	where id = target_afastamento_id;

	if current_status is null then
		raise exception 'Afastamento nao encontrado';
	end if;

	if current_status in ('avaliado', 'aguardando_rh', 'concluido') then
		raise exception 'A avaliacao ja foi concluida e nao pode ser reencaminhada pela triagem';
	end if;

	select av.usuario_id, p.nome_completo
	into target_user_id, target_nome
	from afastamentos.avaliadores av
	join app_auth.usuarios u on u.id = av.usuario_id and u.ativo
	join servidores.pessoas p on p.id = u.pessoa_id
	where av.id = target_avaliador_id
		and av.ativo
		and av.disponivel
		and exists (
			select 1
			from app_auth.usuario_perfis up
			join app_auth.perfis pf on pf.id = up.perfil_id and pf.ativo
			join app_auth.perfil_permissoes pp on pp.perfil_id = pf.id
			join app_auth.permissoes pe on pe.id = pp.permissao_id
			where up.usuario_id = av.usuario_id
				and (
					(pe.recurso = '*' and pe.acao = '*')
					or (pe.recurso = 'afastamentos' and pe.acao = 'avaliar')
				)
		);

	if target_user_id is null then
		raise exception 'Avaliador indisponivel ou sem permissao para avaliar afastamentos';
	end if;

	select am.id, am.avaliador_id, p.nome_completo
	into current_assignment_id, current_avaliador_id, current_nome
	from afastamentos.avaliacoes_medicas am
	join afastamentos.avaliadores av on av.id = am.avaliador_id
	join app_auth.usuarios u on u.id = av.usuario_id
	join servidores.pessoas p on p.id = u.pessoa_id
	where am.afastamento_id = target_afastamento_id
		and am.status = 'pendente';

	if current_assignment_id is not null then
		if current_avaliador_id = target_avaliador_id then
			raise exception 'Este processo ja esta atribuido a este avaliador';
		end if;

		if not permitir_reatribuicao then
			raise exception 'O processo ja possui avaliador. Use a acao explicita de reatribuicao';
		end if;

		if current_status <> 'aguardando_avaliacao' then
			raise exception 'O processo nao esta em estado valido para reatribuicao';
		end if;

		update afastamentos.avaliacoes_medicas
		set status = 'cancelada'
		where id = current_assignment_id;

		perform afastamentos.add_movimentacao(
			target_afastamento_id,
			'reatribuicao_avaliador',
			'Avaliador reatribuido',
			format('De: %s%sPara: %s%sJustificativa: %s', current_nome, E'\n', target_nome, E'\n', comentarios),
			current_status,
			current_status,
			'restrita'
		);
	else
		if permitir_reatribuicao then
			raise exception 'O processo nao possui atribuicao pendente para reatribuir';
		end if;

		perform public.registrar_triagem_afastamento_core(
			target_afastamento_id,
			'necessita_avaliacao_medica',
			'encaminhar_avaliacao',
			comentarios,
			null
		);
	end if;

	insert into afastamentos.avaliacoes_medicas (
		afastamento_id,
		avaliador_id,
		encaminhado_por
	) values (
		target_afastamento_id,
		target_avaliador_id,
		(select auth.uid())
	);

	delete from afastamentos.notificacoes
	where afastamento_id = target_afastamento_id
		and tipo = 'avaliacao'
		and status = 'pendente';

	insert into afastamentos.notificacoes (
		afastamento_id, destinatario_id, tipo, titulo, mensagem, criado_por
	) values (
		target_afastamento_id,
		target_user_id,
		'avaliacao',
		case when current_assignment_id is null
			then 'Nova avaliacao atribuida'
			else 'Avaliacao reatribuida'
		end,
		comentarios,
		(select auth.uid())
	);
end;
$$;

create or replace function public.emitir_devolutiva_afastamento(
	target_afastamento_id uuid,
	resultado text,
	descricao text,
	orientacoes text default null,
	encaminhar_rh boolean default true
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
begin
	if not public.current_user_has_permission('afastamentos:emitir_devolutiva')
		and not public.current_user_has_permission('afastamentos:avaliar') then
		raise exception 'Usuario sem permissao para emitir devolutiva';
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

	next_status := case when encaminhar_rh then 'aguardando_rh' else 'avaliado' end;

	insert into afastamentos.devolutivas (
		afastamento_id, resultado, descricao, orientacoes, responsavel_id, visibilidade
	) values (
		target_afastamento_id, resultado, nullif(descricao, ''), nullif(orientacoes, ''),
		(select auth.uid()), 'restrita'
	);

	update afastamentos.avaliacoes_medicas
	set status = 'concluida', concluido_em = now()
	where afastamento_id = target_afastamento_id and status = 'pendente';

	update afastamentos.afastamentos
	set status = next_status, updated_at = now()
	where id = target_afastamento_id;

	perform afastamentos.add_movimentacao(
		target_afastamento_id, 'devolutiva', 'Devolutiva emitida', orientacoes,
		current_status, next_status, 'restrita'
	);
end;
$$;
