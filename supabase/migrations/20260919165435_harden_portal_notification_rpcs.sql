grant update (status, lida_em) on table app_auth.notificacoes to authenticated;

create policy "notificacoes_update_own"
on app_auth.notificacoes for update
to authenticated
using (destinatario_id = (select auth.uid()))
with check (destinatario_id = (select auth.uid()));

alter function public.listar_minhas_notificacoes(integer) security invoker;
alter function public.contar_minhas_notificacoes_pendentes() security invoker;
alter function public.marcar_notificacao_lida(uuid) security invoker;
alter function public.marcar_todas_notificacoes_lidas() security invoker;

comment on policy "notificacoes_update_own" on app_auth.notificacoes is
  'Permite que o destinatario altere somente status e lida_em de suas notificacoes.';
