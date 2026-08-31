-- ===========================================================================
-- Funcoes de gatilho nao sao API.
--
-- Tudo em `public` vira endpoint em /rest/v1/rpc/. Estas funcoes so devem ser
-- chamadas pelos gatilhos que as declaram — em especial `preparar_conta_nova`,
-- que e SECURITY DEFINER e portanto rodaria com privilegios elevados.
-- Gatilhos executam independentemente do GRANT, entao revogar nao os afeta.
--
-- Apontado pelo linter de seguranca do Supabase (lints 0028 e 0029).
-- ===========================================================================

revoke execute on function public.preparar_conta_nova()  from anon, authenticated, public;
revoke execute on function public.tocar_atualizado_em()  from anon, authenticated, public;
revoke execute on function public.checar_dono_registro() from anon, authenticated, public;
revoke execute on function public.checar_tag_do_item()   from anon, authenticated, public;
