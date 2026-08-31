/** Modelo de dominio do Planner Fofo, usado igual por mobile e desktop. */

import type { ChavePaleta } from './theme';
import type { ListaTipo } from './database.types';

export type { ListaTipo };

/** Abas da navegacao principal. */
export type Aba = 'hoje' | 'estudos' | 'tarefas' | 'stats';

/** Periodos do grafico de estatisticas. */
export type Periodo = 'Semana' | 'Mês' | 'Ano';

/** Escopo de uma lista: apenas o dia de hoje, ou o historico completo. */
export type Escopo = 'hoje' | 'tudo';

/** Habito fixo, ja no formato do cliente (agenda com indice 0 = segunda). */
export interface Habito {
  id: string;
  nome: string;
  emoji: string;
  cor: ChavePaleta;
  /** 7 posicoes, indice 0 = segunda ... 6 = domingo. */
  agenda: boolean[];
  ordem: number;
  arquivado: boolean;
  criadoEm: string;
}

/** Habito somado ao que ja foi marcado na semana corrente. */
export interface HabitoDaSemana extends Habito {
  /** Conclusoes da semana atual, indice 0 = segunda ... 6 = domingo. */
  semana: boolean[];
}

/** Rascunho editado na folha de "Novo/Editar habito". */
export interface RascunhoHabito {
  /** `null` enquanto o habito nao existe no banco. */
  id: string | null;
  nome: string;
  emoji: string;
  cor: ChavePaleta;
  agenda: boolean[];
}

/** Materia (Estudos) ou categoria (Avulsas). */
export interface Tag {
  id: string;
  lista: ListaTipo;
  nome: string;
  cor: ChavePaleta;
}

/** Item de uma das listas sem pressao. */
export interface Item {
  id: string;
  lista: ListaTipo;
  texto: string;
  tagId: string | null;
  feito: boolean;
  /** Data ISO `YYYY-MM-DD`. */
  data: string;
}

/** Rascunho do modal de novo item. */
export interface RascunhoItem {
  lista: ListaTipo;
  texto: string;
  tagId: string | null;
  data: string;
}

/** Itens de um mesmo dia, como nos grupos do design. */
export interface GrupoDeItens {
  data: string;
  rotulo: string;
  contagem: string;
  itens: Item[];
}

/** Uma barra do grafico de periodo. */
export interface PontoGrafico {
  rotulo: string;
  valor: number;
}

/** Consistencia de um habito dentro de um periodo. */
export interface Consistencia {
  habitoId: string;
  feitos: number;
  meta: number;
  pct: number;
}

/** Medalha da grade "Conquistas fofas". */
export interface Conquista {
  emoji: string;
  nome: string;
  dica: string;
  conquistada: boolean;
}

/** Preferencias da usuaria. */
export interface Perfil {
  id: string;
  nome: string;
  acento: string;
  progressoCircular: boolean;
  comemoracao: boolean;
}
