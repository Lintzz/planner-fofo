-- ===========================================================================
-- Fecha de verdade as funcoes de estatistica.
--
-- A migracao anterior revogava EXECUTE de `anon`, mas o Postgres concede
-- EXECUTE a `PUBLIC` por padrao ao criar uma funcao — e `anon` herda dai.
-- Revogar do papel nomeado nao remove o privilegio herdado, entao as quatro
-- funcoes continuavam chamaveis sem login via /rest/v1/rpc/.
--
-- Elas sao `security invoker` e dependem de auth.uid(), entao nao vazavam dado
-- (sem sessao devolviam vazio). Ainda assim, nao devem ser superficie publica.
--
-- Encontrado por scripts/checar-supabase.mjs.
-- ===========================================================================

revoke execute on function public.resumo_periodo(date, date) from public;
revoke execute on function public.pct_do_dia(date)           from public;
revoke execute on function public.streak_atual()             from public;
revoke execute on function public.consistencia(date, date)   from public;

-- Reafirma quem pode: apenas contas autenticadas.
grant execute on function public.resumo_periodo(date, date) to authenticated;
grant execute on function public.pct_do_dia(date)           to authenticated;
grant execute on function public.streak_atual()             to authenticated;
grant execute on function public.consistencia(date, date)   to authenticated;
