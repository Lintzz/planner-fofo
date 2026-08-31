/**
 * Cliente Supabase do app desktop.
 *
 * O Vite so expoe variaveis via `import.meta.env`, que o Metro (mobile) nao
 * consegue parsear — por isso o shared nao le esse objeto sozinho. Aqui os
 * valores sao repassados por `definirAmbiente()` antes de criar o cliente.
 */
import { definirAmbiente, obterCliente } from '@planner-fofo/shared';

definirAmbiente({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const supabase = obterCliente({
  // O Chromium do Electron tem localStorage; a sessao sobrevive ao fechar a app.
  storage: window.localStorage,
  // Nao ha redirect OAuth via URL numa janela Electron.
  detectarSessaoNaUrl: false,
  nomeCliente: 'planner-fofo-desktop',
});
