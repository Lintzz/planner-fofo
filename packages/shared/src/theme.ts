/**
 * Design tokens do Planner Fofo.
 *
 * Todos os valores foram extraidos literalmente do design de referencia
 * (Planner Fofo.dc.html / Planner Fofo Web.dc.html) para que mobile e desktop
 * compartilhem exatamente a mesma linguagem visual.
 */

/** Chaves de paleta usadas por habitos e tags. Espelha o enum `paleta` no Postgres. */
export type ChavePaleta =
  | 'rosa'
  | 'lilas'
  | 'roxo'
  | 'menta'
  | 'pessego'
  | 'ceu'
  | 'amarelo';

export interface Paleta {
  /** Fundo do card */
  bg: string;
  /** Borda do card */
  borda: string;
  /** Texto principal */
  texto: string;
  /** Texto secundario / apoio */
  suave: string;
  /** Cor de destaque (check preenchido, barras, pontinho da tag) */
  forte: string;
}

export const PALETAS: Record<ChavePaleta, Paleta> = {
  rosa: { bg: '#fff0f8', borda: '#f8d3e9', texto: '#b8437f', suave: '#d189b0', forte: '#ff8fc4' },
  lilas: { bg: '#f7f0ff', borda: '#e6d7fb', texto: '#7d4fbf', suave: '#a68ccc', forte: '#b78af0' },
  roxo: { bg: '#f2eefe', borda: '#ddd4fa', texto: '#6a4dc4', suave: '#9a8bd0', forte: '#9a8bf5' },
  menta: { bg: '#edfaf5', borda: '#cdeee2', texto: '#3f9c7c', suave: '#82bfa9', forte: '#7fd8b8' },
  pessego: { bg: '#fff5ed', borda: '#fbdfc9', texto: '#c97a3f', suave: '#d5a781', forte: '#ffbe8f' },
  ceu: { bg: '#eef6ff', borda: '#d3e6fb', texto: '#3f77bf', suave: '#89aed6', forte: '#8fc3ff' },
  amarelo: { bg: '#fffaea', borda: '#f9ecc4', texto: '#b08a1f', suave: '#cdb676', forte: '#ffdd77' },
};

export const CHAVES_PALETA = Object.keys(PALETAS) as ChavePaleta[];

/** Paletas oferecidas no seletor de cor de habito (ordem do design). */
export const CORES_HABITO: ChavePaleta[] = ['rosa', 'lilas', 'roxo', 'menta', 'pessego'];

export const paleta = (chave: string | null | undefined): Paleta =>
  PALETAS[(chave as ChavePaleta) in PALETAS ? (chave as ChavePaleta) : 'lilas'];

/** Cores de interface fora das paletas de habito. */
export const CORES = {
  // Textos
  titulo: '#6b4278',
  tituloForte: '#8b3f9e',
  tituloSuave: '#6b3d7a',
  subtitulo: '#b98ec9',
  rotulo: '#bb95c8',
  apoio: '#c295d0',
  apoioForte: '#a173b4',
  grupo: '#8b6398',
  grupoContagem: '#c8a6d4',
  aba: '#bb9ac6',
  abaAtiva: '#c04290',
  feitoTexto: '#c0aec0',

  // Superficies
  fundoApp: '#fdf3f8',
  cartao: '#fffdfe',
  cartaoAlt: '#fffafd',
  telefone: '#fffaFd',
  bordaCartao: '#f6e2f0',
  bordaSuave: '#f4e2f0',
  bordaClara: '#f1e7f3',
  pilula: '#fbeef7',
  pilulaAtiva: '#ffffff',
  chipAtivo: '#fce4f4',
  chipBorda: '#f7c9e6',
  divisor: '#f6e6f2',
  trilha: '#f8edf6',

  // Feitos / vazios
  feitoBg: '#fbf9fc',
  feitoBorda: '#ece4ee',
  vazioBorda: '#f2ddec',
  barraVazia: '#f4ecf3',
  diaVazio: '#fbf7fa',
  diaInativo: '#f1e8ef',
  diaRotuloOff: '#e4d8e2',
  diaRotuloNeutro: '#cdb8c9',

  // Acentos
  rosaForte: '#d1478f',
  rosaMedio: '#c9438f',
  roxoForte: '#7a55c9',
  roxoMedio: '#9484c0',
  rosaSuave: '#c2789f',
  fechar: '#b96fa8',
  remover: '#d8b6d0',

  // Campos
  campoBorda: '#f4d8ec',
  campoBordaFoco: '#e9a7d6',
  campoFundo: '#fffafd',
} as const;

/** Gradientes reutilizados. Cada plataforma converte no formato adequado. */
export const GRADIENTES = {
  /** Botao primario / logo — `linear-gradient(140deg, #ff9fd0, #c98af0)` */
  primario: ['#ff9fd0', '#c98af0'] as const,
  /** Card de progresso — `linear-gradient(155deg, ...)` */
  heroi: ['#ffe1f2', '#f3ddfb', '#e6dcfd'] as const,
  /** Fundo do app — `radial-gradient(... #fce7f3, #f5eafc, #efe9fb)` */
  fundo: ['#fce7f3', '#f5eafc', '#efe9fb'] as const,
  /**
   * Fade atrás da barra de abas — no design é
   * `linear-gradient(to top, #fffafd 62%, transparent)`, para o conteúdo
   * desaparecer em vez de cruzar a barra. Aqui termina na cor do pé do fundo.
   * O topo usa a mesma cor com alpha 0: no Android, interpolar para
   * `transparent` puro passa por cinza e suja o degradê.
   */
  fundoRodape: ['rgba(239,233,251,0)', 'rgba(239,233,251,0.92)', '#efe9fb'] as const,
  /** Card de streak */
  streak: ['#ffe4f1', '#ffd6ea'] as const,
  /** Card de media */
  media: ['#efe6ff', '#e4dbfe'] as const,
  /** Card de conquistas */
  conquistas: ['#f6ecff', '#ffeaf6'] as const,
  /** Dia selecionado no seletor de agenda */
  diaAtivo: ['#ffd9ee', '#e8d9fd'] as const,
  /** Anel de progresso quando o modo circular esta desligado */
  anelLiso: ['#ffd9ee', '#e8d9fd'] as const,
} as const;

/** Cor da barra do grafico conforme o percentual do dia. */
export const corDaBarra = (valor: number): { cores: readonly string[]; solido?: string } => {
  if (valor === 0) return { cores: [CORES.barraVazia, CORES.barraVazia], solido: CORES.barraVazia };
  if (valor >= 100) return { cores: ['#ff9fd0', '#f37fbd'] };
  if (valor >= 70) return { cores: ['#c98af0', '#a86ce0'] };
  return { cores: ['#e0cbfb', '#cdb4f3'] };
};

/** Cores do confete da comemoracao de 100%. */
export const CORES_CONFETE = ['#ff9fd0', '#c98af0', '#9a8bf5', '#7fd8b8', '#ffbe8f', '#ffe27a'];

export const FONTES = {
  /** Titulos, numeros e botoes — arredondada */
  titulo: 'Baloo 2',
  /** Corpo de texto */
  corpo: 'Nunito',
} as const;

/** Pesos usados no design, por familia. */
export const PESOS = {
  balooMedio: '500',
  balooSemi: '600',
  balooBold: '700',
  balooExtra: '800',
  nunitoRegular: '400',
  nunitoSemi: '600',
  nunitoBold: '700',
  nunitoExtra: '800',
} as const;

/** Raios de canto recorrentes. */
export const RAIOS = {
  pilula: 999,
  cartaoGrande: 32,
  cartao: 28,
  habito: 26,
  item: 22,
  campo: 18,
  botao: 20,
  icone: 15,
  caixa: 9,
  folha: 36,
} as const;

/** Emojis oferecidos no seletor de icone do habito. */
export const EMOJIS_HABITO = [
  '🌷', '💧', '👟', '🥗', '📚', '🌙', '🧘', '🧼', '💊', '🎧', '🖊️', '🐾',
];

/** Rotulos curtos dos dias (segunda a domingo). */
export const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;
/** Rotulos longos dos dias (segunda a domingo). */
export const DIAS_LONGOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] as const;
/** Meses abreviados. */
export const MESES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
] as const;
