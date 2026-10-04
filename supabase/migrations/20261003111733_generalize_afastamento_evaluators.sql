insert into app_auth.permissoes (nome, recurso, acao)
values ('Avaliar afastamentos', 'afastamentos', 'avaliar')
on conflict (recurso, acao) do update
set nome = excluded.nome;

insert into app_auth.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from app_auth.perfis p
cross join app_auth.permissoes pe
where p.nome = 'medico'
	and pe.recurso = 'afastamentos'
	and pe.acao = 'avaliar'
on conflict (perfil_id, permissao_id) do nothing;

create table if not exists afastamentos.avaliadores (
	id uuid primary key default gen_random_uuid(),
	usuario_id uuid not null references app_auth.usuarios(id) on delete restrict,
	medico_id uuid references medicos.medicos(id) on delete restrict,
	tipo text not null,
	registro_profissional text,
	especialidade text,
	unidade_id uuid references organizacional.unidades(id) on delete set null,
	ativo boolean not null default true,
	disponivel boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint avaliadores_tipo_check check (tipo in ('medico', 'perito', 'profissional_autorizado')),
	constraint avaliadores_tipo_identidade_check check (tipo <> 'medico' or medico_id is not null),
	unique (usuario_id, tipo)
);

create unique index if not exists avaliadores_medico_unique_idx
on afastamentos.avaliadores (medico_id)
where medico_id is not null;

create index if not exists avaliadores_disponiveis_idx
on afastamentos.avaliadores (tipo, ativo, disponivel, usuario_id);

drop trigger if exists set_avaliadores_updated_at on afastamentos.avaliadores;
create trigger set_avaliadores_updated_at
before update on afastamentos.avaliadores
for each row execute function public.set_updated_at();

insert into afastamentos.avaliadores (
	usuario_id,
	medico_id,
	tipo,
	registro_profissional,
	especialidade,
	unidade_id
)
select
	u.id,
	m.id,
	'medico',
	concat_ws(' ', rp.conselho, rp.numero || '/' || rp.uf),
	esp.nome,
	lu.unidade_id
from medicos.medicos m
join servidores.servidores s on s.id = m.servidor_id and s.ativo
join servidores.pessoas p on p.id = s.pessoa_id and p.ativo
join app_auth.usuarios u on u.pessoa_id = p.id and u.ativo
left join lateral (
	select r.conselho, r.numero, r.uf
	from medicos.registros_profissionais r
	where r.medico_id = m.id and r.ativo
	order by r.principal desc, r.created_at
	limit 1
) rp on true
left join lateral (
	select e.nome
	from medicos.medico_especialidades me
	join medicos.especialidades e on e.id = me.especialidade_id and e.ativo
	where me.medico_id = m.id
	order by me.principal desc, e.nome
	limit 1
) esp on true
left join lateral (
	select la.unidade_id
	from medicos.locais_atendimento la
	where la.medico_id = m.id and la.ativo
	order by la.principal desc, la.created_at
	limit 1
) lu on true
where m.ativo
on conflict (usuario_id, tipo) do update
set
	medico_id = excluded.medico_id,
	registro_profissional = excluded.registro_profissional,
	especialidade = excluded.especialidade,
	unidade_id = excluded.unidade_id,
	updated_at = now();

alter table afastamentos.avaliacoes_medicas
	add column if not exists avaliador_id uuid references afastamentos.avaliadores(id) on delete restrict;

update afastamentos.avaliacoes_medicas am
set avaliador_id = av.id
from afastamentos.avaliadores av
where am.avaliador_id is null
	and av.medico_id = am.medico_id;

create index if not exists avaliacoes_medicas_avaliador_fila_idx
on afastamentos.avaliacoes_medicas (avaliador_id, status, encaminhado_em)
where status = 'pendente';

alter table afastamentos.avaliadores enable row level security;
revoke all on table afastamentos.avaliadores from anon, authenticated;
grant select on table afastamentos.avaliadores to authenticated;

drop policy if exists "avaliadores_select_authorized" on afastamentos.avaliadores;
create policy "avaliadores_select_authorized"
on afastamentos.avaliadores for select
to authenticated
using (
	public.current_user_has_permission('afastamentos:analisar')
	or public.current_user_has_role('administrador')
	or usuario_id = (select auth.uid())
);

drop policy if exists "avaliacoes_medicas_select_authorized" on afastamentos.avaliacoes_medicas;
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
	or exists (
		select 1
		from medicos.medicos m
		join servidores.servidores s on s.id = m.servidor_id
		join app_auth.usuarios u on u.pessoa_id = s.pessoa_id
		where m.id = medico_id
			and u.id = (select auth.uid())
	)
);

create or replace function public.list_avaliadores_para_avaliacao()
returns table (
	avaliador_id uuid,
	tipo text,
	nome text,
	registro_profissional text,
	especialidade text,
	unidade text,
	pacientes_pendentes bigint
)
language plpgsql
stable
security definer
set search_path = afastamentos, medicos, servidores, organizacional, app_auth, public, auth
as $$
begin
	if not public.current_user_has_permission('afastamentos:analisar') then
		raise exception 'Usuario sem permissao para consultar avaliadores';
	end if;

	return query
	select
		av.id,
		av.tipo,
		p.nome_completo,
		av.registro_profissional,
		av.especialidade,
		un.nome,
		count(am.id)::bigint
	from afastamentos.avaliadores av
	join app_auth.usuarios u on u.id = av.usuario_id and u.ativo
	join servidores.pessoas p on p.id = u.pessoa_id and p.ativo
	left join organizacional.unidades un on un.id = av.unidade_id and un.ativo
	left join afastamentos.avaliacoes_medicas am
		on am.avaliador_id = av.id and am.status = 'pendente'
	where av.ativo
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
		)
	group by av.id, av.tipo, p.nome_completo, av.registro_profissional,
		av.especialidade, un.nome
	order by count(am.id), p.nome_completo;
end;
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
	target_medico_id uuid;
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

	select av.usuario_id, av.medico_id, p.nome_completo
	into target_user_id, target_medico_id, target_nome
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

	select am.id, coalesce(am.avaliador_id, av.id), p.nome_completo
	into current_assignment_id, current_avaliador_id, current_nome
	from afastamentos.avaliacoes_medicas am
	left join afastamentos.avaliadores av on av.id = am.avaliador_id or av.medico_id = am.medico_id
	left join app_auth.usuarios u on u.id = av.usuario_id
	left join servidores.pessoas p on p.id = u.pessoa_id
	where am.afastamento_id = target_afastamento_id
		and am.status = 'pendente'
	limit 1;

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
		medico_id,
		encaminhado_por
	) values (
		target_afastamento_id,
		target_avaliador_id,
		target_medico_id,
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
set search_path = afastamentos, medicos, servidores, app_auth, public, auth
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

	select av.usuario_id
	into assigned_user_id
	from afastamentos.avaliacoes_medicas am
	left join afastamentos.avaliadores av
		on av.id = am.avaliador_id
		or av.medico_id = am.medico_id
	where am.afastamento_id = target_afastamento_id
		and am.status = 'pendente'
	limit 1;

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

revoke all on function public.list_avaliadores_para_avaliacao() from public, anon;
grant execute on function public.list_avaliadores_para_avaliacao() to authenticated;

revoke all on function public.encaminhar_avaliacao_afastamento(uuid, uuid, text, boolean)
from public, anon;
grant execute on function public.encaminhar_avaliacao_afastamento(uuid, uuid, text, boolean)
to authenticated;
