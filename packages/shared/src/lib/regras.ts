/**
 * Regras de negocio do planner.
 *
 * Funcoes puras, sem Supabase e sem UI — mobile e desktop chamam as mesmas,
 * o que garante que a porcentagem, os rotulos e as conquistas sejam iguais nos
 * dois apps.
 */

import { DIAS_LONGOS, EMOJIS_HABITO } from '../theme';
import type {
  Conquista,
  GrupoDeItens,
  Habito,
  HabitoDaSemana,
  Item,
  Periodo,
  PontoGrafico,
  RascunhoHabito,
  RascunhoItem,
} from '../types';
import { deIso, diasAtras, indiceDia, rotuloData } from './datas';

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

/** Agenda de 7 dias toda marcada. */
export const AGENDA_TODOS = (): boolean[] => [true, true, true, true, true, true, true];

/** Agenda de 7 dias toda desmarcada. */
export const AGENDA_VAZIA = (): boolean[] => [false, false, false, false, false, false, false];

/**
 * Normaliza a agenda antes de salvar. Como no design, nenhum dia escolhido
 * significa "todos os dias" — nunca um habito que nunca aparece.
 */
export function normalizarAgenda(agenda: boolean[]): boolean[] {
  const sete = Array.from({ length: 7 }, (_, i) => Boolean(agenda[i]));
  return sete.some(Boolean) ? sete : AGENDA_TODOS();
}

/** Texto de apoio abaixo do seletor de dias. */
export function resumoAgenda(agenda: boolean[]): string {
  const escolhidos = agenda.map((on, i) => (on ? DIAS_LONGOS[i] : null)).filter(Boolean) as string[];
  if (!escolhidos.length) return 'Nenhum dia escolhido — vira todos os dias 🌼';
  if (escolhidos.length === 7) return 'Todos os dias · 7x por semana';
  return `${escolhidos.join(', ')} · ${escolhidos.length}x por semana`;
}

/** Rascunho em branco para a folha de novo habito. */
export function rascunhoNovo(): RascunhoHabito {
  return { id: null, nome: '', emoji: EMOJIS_HABITO[0], cor: 'rosa', agenda: AGENDA_VAZIA() };
}

/** Rascunho preenchido a partir de um habito existente. */
export function rascunhoDe(habito: Habito): RascunhoHabito {
  return {
    id: habito.id,
    nome: habito.nome,
    emoji: habito.emoji,
    cor: habito.cor,
    agenda: habito.agenda.slice(),
  };
}

// ---------------------------------------------------------------------------
// Progresso do dia
// ---------------------------------------------------------------------------

/**
 * Habitos na ordem da aba Hoje: primeiro os agendados para hoje, depois o
 * resto — cada grupo mantendo a ordem que a usuaria definiu.
 *
 * Ordenar por "feito" tambem seria possivel, mas foi descartado de proposito:
 * o cartao pularia de lugar no instante em que fosse marcado.
 */
export function ordenarParaHoje<T extends Habito>(habitos: T[], indice = indiceDia()): T[] {
  return habitos.slice().sort((a, b) => {
    const aHoje = a.agenda[indice] ? 0 : 1;
    const bHoje = b.agenda[indice] ? 0 : 1;
    if (aHoje !== bHoje) return aHoje - bHoje;
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.criadoEm < b.criadoEm ? -1 : a.criadoEm > b.criadoEm ? 1 : 0;
  });
}

/** Habitos cobrados hoje (agendados para o dia da semana atual). */
export function habitosDeHoje<T extends Habito>(habitos: T[], indice = indiceDia()): T[] {
  return habitos.filter((h) => !h.arquivado && h.agenda[indice]);
}

/**
 * Porcentagem do dia. Sem nada previsto o dia vale 100% — mesma regra da
 * funcao `resumo_periodo` no Postgres, para os dois numeros nunca divergirem.
 */
export function porcentagemDoDia(habitos: HabitoDaSemana[], indice = indiceDia()): number {
  const previstos = habitosDeHoje(habitos, indice);
  if (!previstos.length) return 100;
  const feitos = previstos.filter((h) => h.semana[indice]).length;
  return Math.round((feitos / previstos.length) * 100);
}

/** Quantos dos habitos de hoje ja foram marcados. */
export function feitosDeHoje(habitos: HabitoDaSemana[], indice = indiceDia()): number {
  return habitosDeHoje(habitos, indice).filter((h) => h.semana[indice]).length;
}

/** Frase de incentivo do card de progresso. */
export function mensagemDoDia(pct: number): string {
  if (pct === 0) return 'Vamos começar devagarinho? 🌷';
  if (pct === 100) return 'Dia completinho! Você arrasou 🎉';
  if (pct < 50) return `${pct}% concluído! Continue assim ✨`;
  return 'Quase lá! Falta pouquinho 💜';
}

/**
 * "3 de 5 hábitos de hoje" — ou de outro dia, quando a tela esta mostrando um
 * dia passado ("3 de 5 hábitos de ontem").
 */
export function resumoDeHoje(
  habitos: HabitoDaSemana[],
  indice = indiceDia(),
  rotulo = 'hoje',
): string {
  const previstos = habitosDeHoje(habitos, indice);
  return `${feitosDeHoje(habitos, indice)} de ${previstos.length} hábitos de ${rotulo}`;
}

/** "4/7 essa semana · meta batida! 🎀" */
export function contadorDaSemana(habito: HabitoDaSemana): string {
  const meta = habito.agenda.filter(Boolean).length;
  const feitos = habito.semana.filter(Boolean).length;
  return `${feitos}/${meta} essa semana${feitos >= meta ? ' · meta batida! 🎀' : ''}`;
}

/** Titulo da aba conforme a secao ativa. */
export function tituloDaAba(aba: string): string {
  if (aba === 'hoje') return 'Seu dia';
  if (aba === 'estudos') return 'Estudos';
  if (aba === 'tarefas') return 'Sem pressão';
  return 'Suas conquistas';
}

/** "Oi, Manu 🌸" */
export function saudacao(nome: string): string {
  return `Oi, ${nome} 🌸`;
}

// ---------------------------------------------------------------------------
// Listas
// ---------------------------------------------------------------------------

/** Filtra os itens conforme escopo e tag selecionada, e ordena por data desc. */
export function filtrarItens(
  itens: Item[],
  opcoes: { escopo: 'hoje' | 'tudo'; tagId?: string | null },
): Item[] {
  const dia = diasAtras(0);
  return itens
    .filter((i) => (opcoes.escopo === 'tudo' ? true : i.data === dia))
    .filter((i) => (opcoes.escopo === 'tudo' && opcoes.tagId ? i.tagId === opcoes.tagId : true))
    .slice()
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

/** Agrupa itens por data preservando a ordem de aparicao. */
export function agruparPorData(itens: Item[]): GrupoDeItens[] {
  const ordem: string[] = [];
  for (const item of itens) {
    if (!ordem.includes(item.data)) ordem.push(item.data);
  }
  return ordem.map((data) => {
    const doDia = itens.filter((i) => i.data === data);
    return {
      data,
      rotulo: rotuloData(data),
      contagem: `${doDia.filter((i) => i.feito).length}/${doDia.length}`,
      itens: doDia,
    };
  });
}

/** Rascunho preenchido a partir de um item existente, para editar. */
export function rascunhoItemDe(item: Item): RascunhoItem {
  return {
    id: item.id,
    lista: item.lista,
    texto: item.texto,
    tagId: item.tagId,
    data: item.data,
  };
}

/** Rodape da lista, que muda conforme o escopo. */
export function rodapeDaLista(
  visiveis: Item[],
  escopo: 'hoje' | 'tudo',
  ehEstudos: boolean,
): string {
  if (escopo === 'hoje') {
    const pendentes = visiveis.filter((i) => !i.feito).length;
    return `${pendentes} pendentes hoje · não contam nas estatísticas 💗`;
  }
  return `${visiveis.length} ${ehEstudos ? 'conteúdos' : 'tarefas'} no histórico`;
}

/** Textos que mudam entre a lista de Estudos e a de Avulsas. */
export function textosDaLista(ehEstudos: boolean) {
  return {
    aviso: ehEstudos
      ? 'Anote os conteúdos do dia por matéria. Toque numa matéria pra ver todo o histórico dela 📖'
      : 'Zona sem pressão: nada daqui entra na porcentagem do dia nem nas estatísticas 💜',
    avisoEmoji: ehEstudos ? '📖' : '🫧',
    rotuloBotao: ehEstudos ? 'Novo conteúdo' : 'Nova tarefa',
    tituloModal: ehEstudos ? 'Novo conteúdo de estudo' : 'Nova tarefa avulsa',
    tituloModalEdicao: ehEstudos ? 'Editar conteúdo de estudo' : 'Editar tarefa avulsa',
    rotuloCampo: ehEstudos ? 'O que estudar' : 'O que fazer',
    placeholder: ehEstudos ? 'Ex: capítulo 4 — distribuições' : 'Ex: lavar a roupa de cama',
    rotuloTags: ehEstudos ? 'Matéria' : 'Categoria',
    rotuloSalvar: ehEstudos ? 'Adicionar ao dia 📚' : 'Adicionar 💗',
    rotuloSalvarEdicao: 'Salvar alterações 💜',
    vazioHoje: 'Nada anotado pra hoje ainda ✨',
    vazioFiltro: 'Nada por aqui com esse filtro',
  };
}

// ---------------------------------------------------------------------------
// Graficos
// ---------------------------------------------------------------------------

/** Titulo do card de grafico, por periodo. */
export function tituloDoGrafico(periodo: Periodo, mesAtual: string): string {
  if (periodo === 'Semana') return 'Seus dias desta semana';
  if (periodo === 'Mês') return `Semanas de ${mesAtual}`;
  return 'Seu ano até aqui';
}

/**
 * Converte o retorno diario de `resumo_periodo` nas barras do grafico.
 *
 * - Semana: um ponto por dia (Seg..Dom)
 * - Mes:    media por semana do mes (S1..S5)
 * - Ano:    media por mes (J..D)
 *
 * Dias futuros nao entram na media; a barra fica em 0, como no design.
 */
export function montarBarras(
  periodo: Periodo,
  resumo: { dia: string; pct: number }[],
): PontoGrafico[] {
  const ate = diasAtras(0);
  const passados = resumo.filter((r) => r.dia <= ate);

  if (periodo === 'Semana') {
    const rotulos = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return rotulos.map((rotulo, i) => {
      const ponto = passados.find((r) => indiceDia(r.dia) === i);
      return { rotulo, valor: ponto ? ponto.pct : 0 };
    });
  }

  if (periodo === 'Mês') {
    const baldes = new Map<number, number[]>();
    for (const r of passados) {
      const semana = Math.floor((deIso(r.dia).getDate() - 1) / 7);
      const atual = baldes.get(semana) ?? [];
      atual.push(r.pct);
      baldes.set(semana, atual);
    }
    const total = Math.max(4, ...[...baldes.keys()].map((k) => k + 1));
    return Array.from({ length: total }, (_, i) => ({
      rotulo: `S${i + 1}`,
      valor: media(baldes.get(i) ?? []),
    }));
  }

  const rotulosAno = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const porMes = new Map<number, number[]>();
  for (const r of passados) {
    const mes = deIso(r.dia).getMonth();
    const atual = porMes.get(mes) ?? [];
    atual.push(r.pct);
    porMes.set(mes, atual);
  }
  return rotulosAno.map((rotulo, i) => ({ rotulo, valor: media(porMes.get(i) ?? []) }));
}

const media = (valores: number[]): number =>
  valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : 0;

/** Media do periodo, ignorando dias sem nada registrado (como no design). */
export function mediaDoPeriodo(barras: PontoGrafico[]): number {
  return media(barras.filter((b) => b.valor > 0).map((b) => b.valor));
}

/** Espacamento entre as barras — o ano tem 12, entao aperta um pouco. */
export const gapDasBarras = (periodo: Periodo): number => (periodo === 'Ano' ? 4 : 9);

// ---------------------------------------------------------------------------
// Conquistas
// ---------------------------------------------------------------------------

export interface EntradaConquistas {
  /** Dias 100% consecutivos ate hoje. */
  streak: number;
  /** Total de marcacoes de habito de todos os tempos. */
  totalConclusoes: number;
  /** Dias distintos em que algo foi marcado. */
  diasComRegistro: number;
  /** Dias em que TODOS os habitos previstos foram feitos (descanso nao conta). */
  diasCompletos: number;
  /** Media do mes corrente, em %. */
  mediaMes: number;
  /** Media do ano corrente, em %. */
  mediaAno: number;
}

/** Quantos dias de uso uma media precisa ter antes de virar conquista. */
const AMOSTRA_MES = 10;
const AMOSTRA_ANO = 30;

/**
 * Monta a grade "Conquistas fofas".
 *
 * Três regras guiam a lista, e as três vieram de defeitos reais da versão
 * anterior:
 *
 * 1. **Medir ação, nunca configuração.** Antes havia "Rotina montada"
 *    (>= 3 hábitos) e "Semana toda ativa" (algum hábito com agenda de 7 dias).
 *    As duas nasciam conquistadas, porque o gatilho de signup já cria cinco
 *    hábitos — sem que a usuária tivesse feito nada.
 *
 * 2. **Nada de hábito específico.** Havia "Fiel a: <nome do hábito>". Os
 *    hábitos são criados por quem usa, então a conquista mudava de nome de
 *    pessoa para pessoa — e desbloqueava no primeiro dia, porque 1 de 1 dia
 *    previsto dá 100%.
 *
 * 3. **Amostra mínima antes de premiar média.** "Mês redondo" e "Ano acima de
 *    80%" olhavam só a média: fechar o primeiro dia dava 100% e conquistava as
 *    duas de uma vez.
 *
 * `diasCompletos` vem do banco já excluindo dia de descanso. Dia sem hábito
 * previsto vale 100% para não quebrar a sequência, mas não é dia conquistado.
 */
export function montarConquistas(entrada: EntradaConquistas): Conquista[] {
  const { streak, totalConclusoes, diasComRegistro, diasCompletos, mediaMes, mediaAno } = entrada;

  /** Dica de uma meta numérica simples: "3/7 dias". */
  const progresso = (atual: number, meta: number, unidade: string) =>
    `${Math.min(atual, meta)}/${meta} ${unidade}`;

  /**
   * Dica das conquistas de média: mostra o que está faltando primeiro — dias
   * de uso ou a própria média —, em vez de um número que não explica nada.
   */
  const dicaDeMedia = (media: number, dias: number, amostra: number, periodo: string) =>
    dias < amostra
      ? `faltam ${amostra - dias} dias de uso`
      : `${media}% de média ${periodo} · meta 80%`;

  const lista: Conquista[] = [
    {
      emoji: '🌱',
      nome: 'Primeiro passo',
      conquistada: totalConclusoes >= 1,
      dica: 'marque 1 hábito',
    },
    {
      emoji: '💯',
      nome: 'Dia completo',
      conquistada: diasCompletos >= 1,
      dica: 'feche todos os hábitos de um dia',
    },
    {
      emoji: '🍀',
      nome: '3 dias completos',
      conquistada: diasCompletos >= 3,
      dica: progresso(diasCompletos, 3, 'dias'),
    },
    {
      emoji: '🔥',
      nome: '7 dias seguidos',
      conquistada: streak >= 7,
      dica: progresso(streak, 7, 'dias'),
    },
    {
      emoji: '🌟',
      nome: '30 dias seguidos',
      conquistada: streak >= 30,
      dica: progresso(streak, 30, 'dias'),
    },
    {
      emoji: '🎯',
      nome: '50 conclusões',
      conquistada: totalConclusoes >= 50,
      dica: progresso(totalConclusoes, 50, 'feitos'),
    },
    {
      emoji: '🏆',
      nome: '200 conclusões',
      conquistada: totalConclusoes >= 200,
      dica: progresso(totalConclusoes, 200, 'feitos'),
    },
    {
      emoji: '🌈',
      nome: 'Mês redondo',
      conquistada: diasComRegistro >= AMOSTRA_MES && mediaMes >= 80,
      dica: dicaDeMedia(mediaMes, diasComRegistro, AMOSTRA_MES, 'no mês'),
    },
    {
      emoji: '💜',
      nome: 'Ano acima de 80%',
      conquistada: diasComRegistro >= AMOSTRA_ANO && mediaAno >= 80,
      dica: dicaDeMedia(mediaAno, diasComRegistro, AMOSTRA_ANO, 'no ano'),
    },
  ];

  return lista.map((c) => ({ ...c, dica: c.conquistada ? 'conquistada ✨' : c.dica }));
}
