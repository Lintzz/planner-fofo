-- ===========================================================================
-- Base das conquistas: números de AÇÃO, não de configuração.
--
-- A grade "Conquistas fofas" media coisas erradas: quantos hábitos existem,
-- se algum tinha agenda de 7 dias, quanto valia o melhor hábito num período
-- curto. Tudo isso desbloqueava sozinho numa conta nova, porque o gatilho de
-- signup já cria cinco hábitos — e nenhum deles exigia concluir nada.
--
-- Estes três números só sobem quando a usuária marca hábito de verdade:
--
--   total_conclusoes   linhas em habito_registros (cada marcação vale 1)
--   dias_com_registro  dias distintos com pelo menos uma marcação
--   dias_completos     dias em que TODOS os hábitos previstos foram feitos
--
-- `dias_completos` exige `meta > 0` de propósito: dia de descanso vale 100%
-- em `resumo_periodo` (não quebra a sequência), mas não é um dia conquistado.
-- ===========================================================================

create or replace function public.resumo_conquistas()
returns table (
  total_conclusoes  integer,
  dias_com_registro integer,
  dias_completos    integer
)
language sql
stable
set search_path = ''
as $fn$
  with rotina as (
    select min(h.criado_em::date) as primeiro_dia
    from public.habitos h
    where h.usuario_id = (select auth.uid())
  ),
  cal as (
    -- Sem hábito nenhum, o intervalo começa depois de hoje e devolve 0 dias.
    select serie::date as dia_cal
    from generate_series(
      coalesce((select r.primeiro_dia from rotina r), current_date + 1),
      current_date,
      interval '1 day'
    ) as serie
  ),
  previstos as (
    select cal.dia_cal, h.id as id_habito
    from cal
    join public.habitos h
      on  h.usuario_id = (select auth.uid())
      and not h.arquivado
      and h.criado_em::date <= cal.dia_cal
      and h.agenda[extract(isodow from cal.dia_cal)::int]
  ),
  por_dia as (
    select
      previstos.dia_cal,
      count(*)      as meta,
      count(reg.id) as feitos
    from previstos
    left join public.habito_registros reg
      on  reg.habito_id = previstos.id_habito
      and reg.data = previstos.dia_cal
    group by previstos.dia_cal
  )
  select
    (select count(*)::integer
       from public.habito_registros r
      where r.usuario_id = (select auth.uid())),
    (select count(distinct r.data)::integer
       from public.habito_registros r
      where r.usuario_id = (select auth.uid())),
    (select count(*)::integer
       from por_dia d
      where d.meta > 0 and d.feitos = d.meta);
$fn$;

comment on function public.resumo_conquistas() is
  'Contadores de ação para as conquistas: conclusões, dias com registro e dias completos (descanso não conta).';

revoke execute on function public.resumo_conquistas() from public;
grant  execute on function public.resumo_conquistas() to authenticated;
