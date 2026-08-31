/**
 * Resolucao centralizada de ambiente.
 *
 * Cada plataforma expoe variaveis de um jeito diferente:
 *   - Expo   -> `process.env.EXPO_PUBLIC_*` (injetado no bundle pelo Metro)
 *   - Vite   -> `import.meta.env.VITE_*`   (so existe dentro do bundle Vite)
 *   - Node   -> `process.env.*`            (main do Electron, scripts, CLI)
 *
 * `import.meta` nao e sintaxe valida para o Metro, entao este modulo le apenas
 * `process.env`. Ambientes baseados em `import.meta` (Vite) injetam seus
 * valores chamando `definirAmbiente()` no bootstrap do app.
 */

export interface AmbientePlanner {
  /** URL do projeto Supabase, ex: https://abcdefgh.supabase.co */
  supabaseUrl: string;
  /** Chave publica anon/publishable. Nunca a service_role. */
  supabaseAnonKey: string;
}

/** Nomes aceitos para a URL, em ordem de prioridade. */
const CHAVES_URL = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
];

/** Nomes aceitos para a chave anonima, em ordem de prioridade. */
const CHAVES_ANON = [
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
];

let sobrescrito: Partial<AmbientePlanner> = {};

/**
 * Define (ou complementa) o ambiente em runtime.
 * Usado pelo app desktop, que le `import.meta.env` no proprio bundle.
 */
export function definirAmbiente(parcial: Partial<AmbientePlanner>): void {
  sobrescrito = { ...sobrescrito, ...limpar(parcial) };
}

/** Le uma variavel de `process.env` tentando varios nomes. */
function doProcesso(chaves: string[]): string | undefined {
  const env: Record<string, string | undefined> =
    typeof process !== 'undefined' && process.env ? process.env : {};
  for (const chave of chaves) {
    const valor = env[chave];
    if (valor && valor.trim()) return valor.trim();
  }
  return undefined;
}

function limpar(parcial: Partial<AmbientePlanner>): Partial<AmbientePlanner> {
  const saida: Partial<AmbientePlanner> = {};
  if (parcial.supabaseUrl?.trim()) saida.supabaseUrl = parcial.supabaseUrl.trim();
  if (parcial.supabaseAnonKey?.trim()) saida.supabaseAnonKey = parcial.supabaseAnonKey.trim();
  return saida;
}

/** Ambiente resolvido, sem validar. Util para telas de diagnostico. */
export function lerAmbiente(): Partial<AmbientePlanner> {
  return {
    supabaseUrl: sobrescrito.supabaseUrl ?? doProcesso(CHAVES_URL),
    supabaseAnonKey: sobrescrito.supabaseAnonKey ?? doProcesso(CHAVES_ANON),
  };
}

/** `true` quando url e chave estao presentes. */
export function ambienteConfigurado(): boolean {
  const { supabaseUrl, supabaseAnonKey } = lerAmbiente();
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Ambiente validado. Lanca um erro explicativo se algo estiver faltando —
 * e o unico ponto do codigo que decide se da pra falar com o Supabase.
 */
export function obterAmbiente(): AmbientePlanner {
  const { supabaseUrl, supabaseAnonKey } = lerAmbiente();
  const faltando: string[] = [];
  if (!supabaseUrl) faltando.push('SUPABASE_URL');
  if (!supabaseAnonKey) faltando.push('SUPABASE_ANON_KEY');

  if (faltando.length) {
    throw new Error(
      `Planner Fofo: variaveis de ambiente ausentes (${faltando.join(', ')}).\n` +
        'Copie .env.example para .env na raiz do monorepo e preencha os valores do seu ' +
        'projeto Supabase. No Expo use o prefixo EXPO_PUBLIC_, no Vite use VITE_.',
    );
  }

  return { supabaseUrl: supabaseUrl!, supabaseAnonKey: supabaseAnonKey! };
}
