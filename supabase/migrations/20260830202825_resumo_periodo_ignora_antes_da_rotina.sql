-- ===========================================================================
-- Correcao: dias anteriores ao primeiro habito nao valem 100%.
--
-- A regra "dia sem nada previsto vale 100%" existe para o dia de descanso —
-- quem nao tinha nada agendado naquele dia da semana nao quebrou a rotina.
-- Mas ela vazava para antes da rotina existir: uma conta nova abria a aba
-- Graficos com a semana inteira em 100%, contando dias em que nao havia
-- sequer um habito cadastrado.
--
-- Agora esses dias devolvem 0, que e como o design ja trata dia sem dado
-- (barra cinza, sem rotulo) e que `montarBarras` ja exclui das medias.
-- ===========================================================================

create or replace function public.resumo_periodo(p_inicio date, p_fim date)
returns table (dia date, pct integer)
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
    select serie::date as dia_cal
    from generate_series(p_inicio, p_fim, interval '1 day') as serie
  ),
  previstos as (
    select cal.dia_cal, h.id as id_habito
    from cal
    join public.habitos h
      on  h.usuario_id = (select auth.uid())
      and not h.arquivado
      and h.criado_em::date <= cal.dia_cal
      and h.agenda[extract(isodow from cal.dia_cal)::int]
  )
  select
    cal.dia_cal,
    case
      -- Sem nenhum habito, ou antes do primeiro: dia sem dado.
      when (select r.primeiro_dia from rotina r) is null
        or cal.dia_cal < (select r.primeiro_dia from rotina r) then 0
      -- Dia de descanso: nada previsto, rotina mantida.
      when count(previstos.id_habito) = 0 then 100
      else round(count(reg.id)::numeric * 100 / count(previstos.id_habito))::integer
    end
  from cal
  left join previstos
    on previstos.dia_cal = cal.dia_cal
  left join public.habito_registros reg
    on  reg.habito_id = previstos.id_habito
    and reg.data = cal.dia_cal
  group by cal.dia_cal
  order by cal.dia_cal;
$fn$;

comment on function public.resumo_periodo(date, date) is
  'Porcentagem de habitos concluidos por dia. 0 = sem dado (antes da rotina existir), 100 = dia de descanso ou dia fechado.';
