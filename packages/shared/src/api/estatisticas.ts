/**
 * Estatisticas — tudo vem das funcoes SQL, para nao baixar meses de historico
 * so para desenhar um grafico.
 */

import type { ClientePlanner } from '../supabase';
import type { Consistencia, Periodo, PontoGrafico } from '../types';
import {
  fimDaSemana,
  fimDoAno,
  fimDoMes,
  hoje,
  inicioDaSemana,
  inicioDoAno,
  inicioDoMes,
} from '../lib/datas';
import { montarBarras } from '../lib/regras';

/** Intervalo `[inicio, fim]` coberto por cada periodo do grafico. */
export function intervaloDoPeriodo(
  periodo: Periodo,
  referencia: string = hoje(),
): { inicio: string; fim: string } {
  if (periodo === 'Semana') {
    return { inicio: inicioDaSemana(referencia), fim: fimDaSemana(referencia) };
  }
  if (periodo === 'Mês') {
    return { inicio: inicioDoMes(referencia), fim: fimDoMes(referencia) };
  }
  return { inicio: inicioDoAno(referencia), fim: fimDoAno(referencia) };
}

/** Porcentagem concluida em cada dia do intervalo. */
export async function resumoPeriodo(
  cliente: ClientePlanner,
  inicio: string,
  fim: string,
): Promise<{ dia: string; pct: number }[]> {
  const { data, error } = await cliente.rpc('resumo_periodo', { p_inicio: inicio, p_fim: fim });
  if (error) throw error;
  return data ?? [];
}

/** Porcentagem de um unico dia (padrao: hoje). */
export async function pctDoDia(cliente: ClientePlanner, data: string = hoje()): Promise<number> {
  const { data: valor, error } = await cliente.rpc('pct_do_dia', { p_data: data });
  if (error) throw error;
  return valor ?? 100;
}

/** Dias 100% consecutivos ate hoje. */
export async function streakAtual(cliente: ClientePlanner): Promise<number> {
  const { data, error } = await cliente.rpc('streak_atual');
  if (error) throw error;
  return data ?? 0;
}

/** Consistencia por habito dentro do intervalo. */
export async function consistenciaPeriodo(
  cliente: ClientePlanner,
  inicio: string,
  fim: string,
): Promise<Consistencia[]> {
  const { data, error } = await cliente.rpc('consistencia', { p_inicio: inicio, p_fim: fim });
  if (error) throw error;
  return (data ?? []).map((linha) => ({
    habitoId: linha.id_habito,
    feitos: linha.feitos,
    meta: linha.meta,
    pct: linha.meta > 0 ? Math.min(100, Math.round((linha.feitos / linha.meta) * 100)) : 0,
  }));
}

/** Contadores de acao que alimentam as conquistas. */
export interface ContadoresConquista {
  totalConclusoes: number;
  diasComRegistro: number;
  diasCompletos: number;
}

/** Conclusoes, dias com registro e dias completos de todos os tempos. */
export async function resumoConquistas(
  cliente: ClientePlanner,
): Promise<ContadoresConquista> {
  const { data, error } = await cliente.rpc('resumo_conquistas');
  if (error) throw error;
  const linha = data?.[0];
  return {
    totalConclusoes: linha?.total_conclusoes ?? 0,
    diasComRegistro: linha?.dias_com_registro ?? 0,
    diasCompletos: linha?.dias_completos ?? 0,
  };
}

export interface PainelEstatisticas {
  barras: PontoGrafico[];
  media: number;
  consistencia: Consistencia[];
  streak: number;
  pctHoje: number;
  /** Barras da semana corrente — usadas no cartao de resumo. */
  barrasSemana: PontoGrafico[];
  mediaMes: number;
  mediaAno: number;
  /** Contadores de acao das conquistas. */
  contadores: ContadoresConquista;
}

/**
 * Carrega tudo o que a aba Graficos mostra numa unica rodada.
 *
 * Sempre busca semana, mes e ano: o periodo escolhido alimenta o grafico
 * principal, e os outros dois alimentam as conquistas ("Mês redondo", "Ano
 * acima de 80%"), que ficam visiveis em qualquer periodo.
 */
export async function carregarEstatisticas(
  cliente: ClientePlanner,
  periodo: Periodo,
  referencia: string = hoje(),
): Promise<PainelEstatisticas> {
  const semana = intervaloDoPeriodo('Semana', referencia);
  const mes = intervaloDoPeriodo('Mês', referencia);
  const ano = intervaloDoPeriodo('Ano', referencia);
  const escolhido = intervaloDoPeriodo(periodo, referencia);

  const [porDiaSemana, porDiaMes, porDiaAno, consistencia, streak, pctHoje, contadores] =
    await Promise.all([
      resumoPeriodo(cliente, semana.inicio, semana.fim),
      resumoPeriodo(cliente, mes.inicio, mes.fim),
      resumoPeriodo(cliente, ano.inicio, ano.fim),
      consistenciaPeriodo(cliente, escolhido.inicio, escolhido.fim),
      streakAtual(cliente),
      pctDoDia(cliente, referencia),
      resumoConquistas(cliente),
    ]);

  // O periodo escolhido reaproveita um dos tres resumos ja carregados. Recortar
  // do ano seria errado na virada: a semana de 30/dez a 5/jan cai em dois anos.
  const doPeriodo =
    periodo === 'Semana' ? porDiaSemana : periodo === 'Mês' ? porDiaMes : porDiaAno;

  const barras = montarBarras(periodo, doPeriodo);
  const barrasSemana = montarBarras('Semana', porDiaSemana);
  const barrasMes = montarBarras('Mês', porDiaMes);
  const barrasAno = montarBarras('Ano', porDiaAno);

  return {
    barras,
    media: mediaNaoZero(barras),
    consistencia,
    streak,
    pctHoje,
    barrasSemana,
    mediaMes: mediaNaoZero(barrasMes),
    mediaAno: mediaNaoZero(barrasAno),
    contadores,
  };
}

const mediaNaoZero = (barras: PontoGrafico[]): number => {
  const valores = barras.filter((b) => b.valor > 0).map((b) => b.valor);
  return valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : 0;
};
