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
set search_path = afastamentos, medicos, servidores, app_auth, public, auth
as $$
declare
	current_status text;
	next_status text;
	assigned_medico_id uuid;
begin
	if not public.current_user_has_permission('afastamentos:emitir_devolutiva') then
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

	select am.medico_id into assigned_medico_id
	from afastamentos.avaliacoes_medicas am
	where am.afastamento_id = target_afastamento_id and am.status = 'pendente';

	if assigned_medico_id is not null
		and not public.current_user_has_role('administrador')
		and not exists (
			select 1
			from medicos.medicos m
			join servidores.servidores s on s.id = m.servidor_id
			join app_auth.usuarios usr on usr.pessoa_id = s.pessoa_id
			where m.id = assigned_medico_id and usr.id = (select auth.uid())
		)
	then
		raise exception 'A avaliacao esta atribuida a outro medico';
	end if;

	next_status := case when encaminhar_rh then 'aguardando_rh' else 'avaliado' end;

	insert into afastamentos.devolutivas (
		afastamento_id,
		resultado,
		descricao,
		orientacoes,
		responsavel_id,
		visibilidade
	) values (
		target_afastamento_id,
		resultado,
		nullif(descricao, ''),
		nullif(orientacoes, ''),
		(select auth.uid()),
		'restrita'
	);

	update afastamentos.avaliacoes_medicas
	set status = 'concluida', concluido_em = now()
	where afastamento_id = target_afastamento_id and status = 'pendente';

	update afastamentos.afastamentos
	set status = next_status, updated_at = now()
	where id = target_afastamento_id;

	perform afastamentos.add_movimentacao(
		target_afastamento_id,
		'devolutiva',
		'Devolutiva emitida',
		orientacoes,
		current_status,
		next_status,
		'restrita'
	);
end;
$$;

create or replace function public.registrar_providencia_afastamento(
	target_afastamento_id uuid,
	descricao text,
	concluir boolean default false
)
returns void
language plpgsql
security definer
set search_path = afastamentos, public, auth
as $$
declare
	current_status text;
	next_status text;
begin
	if not public.current_user_has_permission('afastamentos:registrar_providencia') then
		raise exception 'Usuario sem permissao para registrar providencia';
	end if;

	if concluir and not public.current_user_has_permission('afastamentos:concluir') then
		raise exception 'Usuario sem permissao para concluir afastamento';
	end if;

	select status into current_status
	from afastamentos.afastamentos
	where id = target_afastamento_id;

	if current_status is null then
		raise exception 'Afastamento nao encontrado';
	end if;

	if current_status not in ('avaliado', 'aguardando_rh') then
		raise exception 'Afastamento nao esta disponivel para providencia administrativa';
	end if;

	if exists (
		select 1
		from afastamentos.complementacoes
		where afastamento_id = target_afastamento_id
			and status = 'pendente'
	) then
		raise exception 'Nao e possivel concluir com complementacao pendente';
	end if;

	insert into afastamentos.providencias (afastamento_id, descricao, responsavel_id)
	values (target_afastamento_id, nullif(descricao, ''), auth.uid());

	next_status := case when concluir then 'concluido' else 'aguardando_rh' end;

	update afastamentos.afastamentos
	set status = next_status, updated_at = now()
	where id = target_afastamento_id;

	perform afastamentos.add_movimentacao(
		target_afastamento_id,
		'providencia',
		case when concluir then 'Providencia registrada e processo concluido' else 'Providencia administrativa registrada' end,
		descricao,
		current_status,
		next_status,
		'restrita'
	);
end;
$$;
