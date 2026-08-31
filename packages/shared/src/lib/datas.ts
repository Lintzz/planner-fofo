/**
 * Datas do planner, sempre no fuso local.
 *
 * O prototipo do design usava `new Date().toISOString().slice(0, 10)`, que
 * devolve a data em UTC — no Brasil (UTC-3) tudo depois das 21h vira o dia
 * seguinte. Aqui as datas sao montadas a partir dos getters locais, para que
 * "hoje" seja o hoje de quem esta olhando a tela.
 */

import { DIAS_LONGOS, MESES } from '../theme';

const doisDigitos = (n: number): string => String(n).padStart(2, '0');

/** `Date` -> `YYYY-MM-DD` no fuso local. */
export function paraIso(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** `YYYY-MM-DD` -> `Date` ao meio-dia local (imune a horario de verao). */
export function deIso(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1, 12, 0, 0, 0);
}

/** Data de hoje em ISO. */
export function hoje(): string {
  return paraIso(new Date());
}

/** ISO de `n` dias atras. Valores negativos vao para o futuro. */
export function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return paraIso(d);
}

/** ISO deslocado em `n` dias a partir de outra data ISO. */
export function somarDias(iso: string, n: number): string {
  const d = deIso(iso);
  d.setDate(d.getDate() + n);
  return paraIso(d);
}

/**
 * Indice do dia da semana no formato do app: 0 = segunda ... 6 = domingo.
 * `Date.getDay()` devolve 0 = domingo, por isso o deslocamento.
 */
export function indiceDia(data: Date | string = new Date()): number {
  const d = typeof data === 'string' ? deIso(data) : data;
  return (d.getDay() + 6) % 7;
}

/** Segunda-feira da semana de `iso`. */
export function inicioDaSemana(iso: string = hoje()): string {
  return somarDias(iso, -indiceDia(iso));
}

/** Domingo da semana de `iso`. */
export function fimDaSemana(iso: string = hoje()): string {
  return somarDias(inicioDaSemana(iso), 6);
}

/** Primeiro dia do mes de `iso`. */
export function inicioDoMes(iso: string = hoje()): string {
  const d = deIso(iso);
  return paraIso(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Ultimo dia do mes de `iso`. */
export function fimDoMes(iso: string = hoje()): string {
  const d = deIso(iso);
  return paraIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** 1 de janeiro do ano de `iso`. */
export function inicioDoAno(iso: string = hoje()): string {
  return `${deIso(iso).getFullYear()}-01-01`;
}

/** 31 de dezembro do ano de `iso`. */
export function fimDoAno(iso: string = hoje()): string {
  return `${deIso(iso).getFullYear()}-12-31`;
}

/**
 * Rotulo humano de uma data, como nos cabecalhos de grupo do design:
 * "Hoje", "Ontem", "Amanhã" ou "qua, 27 ago".
 */
export function rotuloData(iso: string): string {
  if (iso === diasAtras(0)) return 'Hoje';
  if (iso === diasAtras(1)) return 'Ontem';
  if (iso === diasAtras(-1)) return 'Amanhã';
  const d = deIso(iso);
  return `${DIAS_LONGOS[indiceDia(d)]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** Lista de datas ISO de `inicio` a `fim`, inclusive. */
export function intervalo(inicio: string, fim: string): string[] {
  const saida: string[] = [];
  let atual = inicio;
  // Guarda de seguranca: no maximo ~10 anos de dias.
  for (let i = 0; atual <= fim && i < 3700; i += 1) {
    saida.push(atual);
    atual = somarDias(atual, 1);
  }
  return saida;
}
