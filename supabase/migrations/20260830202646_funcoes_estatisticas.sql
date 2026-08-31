-- ===========================================================================
-- Planner Fofo — funcoes de estatistica
--
-- A porcentagem do dia, a sequencia e a consistencia sao derivadas dos
-- registros. Calcular no banco evita baixar meses de historico so para
-- desenhar um grafico, e garante que mobile e desktop mostrem o mesmo numero.
--
-- Todas rodam como `security invoker`: as policies de RLS continuam valendo, e
-- `auth.uid()` identifica quem esta perguntando.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Porcentagem concluida em cada dia de um intervalo.
--
-- "Previsto" = habito nao arquivado, ja existente naquele dia, e agendado para
-- aquele dia da semana. Um dia sem nada previsto vale 100% — dia de descanso
-- nao quebra a rotina.
-- ---------------------------------------------------------------------------

create or replace function public.resumo_periodo(p_inicio date, p_fim date)
returns table (dia date, pct integer)
language sql
stable
set search_path = ''
as $fn$
  with cal as (
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
  'Porcentagem de habitos concluidos por dia no intervalo [p_inicio, p_fim].';

-- ---------------------------------------------------------------------------
-- Atalho para um unico dia — usado no card de progresso da aba Hoje.
-- ---------------------------------------------------------------------------

create or replace function public.pct_do_dia(p_data date default current_date)
returns integer
language sql
stable
set search_path = ''
as $fn$
  select coalesce((select r.pct from public.resumo_periodo(p_data, p_data) r), 100);
$fn$;

-- ---------------------------------------------------------------------------
-- Sequencia atual de dias 100%.
--
-- O dia de hoje ainda esta em andamento: se ainda nao fechou, a contagem
-- comeca em ontem em vez de zerar a sequencia da usuaria.
-- ---------------------------------------------------------------------------

create or replace function public.streak_atual()
returns integer
language plpgsql
stable
set search_path = ''
as $fn$
declare
  cursor_dia    date := current_date;
  pct_do_cursor integer;
  total         integer := 0;
  primeiro_dia  date;
begin
  -- Sem habitos ainda nao existe sequencia.
  select min(h.criado_em::date) into primeiro_dia
    from public.habitos h
   where h.usuario_id = (select auth.uid());

  if primeiro_dia is null then
    return 0;
  end if;

  select r.pct into pct_do_cursor from public.resumo_periodo(cursor_dia, cursor_dia) r;
  if coalesce(pct_do_cursor, 0) < 100 then
    cursor_dia := cursor_dia - 1;
  end if;

  while cursor_dia >= primeiro_dia loop
    select r.pct into pct_do_cursor from public.resumo_periodo(cursor_dia, cursor_dia) r;
    exit when coalesce(pct_do_cursor, 0) < 100;
    total := total + 1;
    cursor_dia := cursor_dia - 1;
  end loop;

  return total;
end;
$fn$;

comment on function public.streak_atual() is
  'Dias 100% consecutivos ate hoje. Hoje incompleto nao quebra a sequencia.';

-- ---------------------------------------------------------------------------
-- Consistencia por habito no periodo — feitos sobre dias agendados.
-- ---------------------------------------------------------------------------

create or replace function public.consistencia(p_inicio date, p_fim date)
returns table (id_habito uuid, feitos integer, meta integer)
language sql
stable
set search_path = ''
as $fn$
  with cal as (
    select serie::date as dia_cal
    from generate_series(p_inicio, p_fim, interval '1 day') as serie
  ),
  previstos as (
    select h.id as habito, cal.dia_cal
    from public.habitos h
    join cal
      on  h.agenda[extract(isodow from cal.dia_cal)::int]
      and h.criado_em::date <= cal.dia_cal
    where h.usuario_id = (select auth.uid())
      and not h.arquivado
  )
  select
    h.id,
    count(reg.id)::integer,
    count(previstos.dia_cal)::integer
  from public.habitos h
  left join previstos
    on previstos.habito = h.id
  left join public.habito_registros reg
    on  reg.habito_id = h.id
    and reg.data = previstos.dia_cal
  where h.usuario_id = (select auth.uid())
    and not h.arquivado
  group by h.id, h.ordem, h.criado_em
  order by h.ordem, h.criado_em;
$fn$;

comment on function public.consistencia(date, date) is
  'Por habito: quantos dias foram feitos e quantos estavam agendados no periodo.';

-- ---------------------------------------------------------------------------
-- Permissoes explicitas — apenas contas autenticadas.
-- ---------------------------------------------------------------------------

revoke execute on function public.resumo_periodo(date, date) from anon;
revoke execute on function public.pct_do_dia(date)           from anon;
revoke execute on function public.streak_atual()             from anon;
revoke execute on function public.consistencia(date, date)   from anon;

grant execute on function public.resumo_periodo(date, date) to authenticated;
grant execute on function public.pct_do_dia(date)           to authenticated;
grant execute on function public.streak_atual()             to authenticated;
grant execute on function public.consistencia(date, date)   to authenticated;
