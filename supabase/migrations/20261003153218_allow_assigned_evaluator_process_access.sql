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
						left join afastamentos.avaliadores av
							on av.id = am.avaliador_id
							or av.medico_id = am.medico_id
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
