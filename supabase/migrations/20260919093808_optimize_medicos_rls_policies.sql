drop policy if exists "medicos_manage" on medicos.medicos;
create policy "medicos_insert"
on medicos.medicos for insert
to authenticated
with check (public.current_user_has_permission('medicos:manage'));
create policy "medicos_update"
on medicos.medicos for update
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));
create policy "medicos_delete"
on medicos.medicos for delete
to authenticated
using (public.current_user_has_permission('medicos:manage'));

drop policy if exists "registros_profissionais_manage" on medicos.registros_profissionais;
create policy "registros_profissionais_insert"
on medicos.registros_profissionais for insert
to authenticated
with check (public.current_user_has_permission('medicos:manage'));
create policy "registros_profissionais_update"
on medicos.registros_profissionais for update
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));
create policy "registros_profissionais_delete"
on medicos.registros_profissionais for delete
to authenticated
using (public.current_user_has_permission('medicos:manage'));

drop policy if exists "especialidades_manage" on medicos.especialidades;
create policy "especialidades_insert"
on medicos.especialidades for insert
to authenticated
with check (public.current_user_has_permission('medicos:manage'));
create policy "especialidades_update"
on medicos.especialidades for update
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));
create policy "especialidades_delete"
on medicos.especialidades for delete
to authenticated
using (public.current_user_has_permission('medicos:manage'));

drop policy if exists "medico_especialidades_manage" on medicos.medico_especialidades;
create policy "medico_especialidades_insert"
on medicos.medico_especialidades for insert
to authenticated
with check (public.current_user_has_permission('medicos:manage'));
create policy "medico_especialidades_update"
on medicos.medico_especialidades for update
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));
create policy "medico_especialidades_delete"
on medicos.medico_especialidades for delete
to authenticated
using (public.current_user_has_permission('medicos:manage'));

drop policy if exists "medico_unidades_manage" on medicos.medico_unidades;
create policy "medico_unidades_insert"
on medicos.medico_unidades for insert
to authenticated
with check (public.current_user_has_permission('medicos:manage'));
create policy "medico_unidades_update"
on medicos.medico_unidades for update
to authenticated
using (public.current_user_has_permission('medicos:manage'))
with check (public.current_user_has_permission('medicos:manage'));
create policy "medico_unidades_delete"
on medicos.medico_unidades for delete
to authenticated
using (public.current_user_has_permission('medicos:manage'));
