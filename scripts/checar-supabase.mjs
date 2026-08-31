/**
 * Sanidade do backend, sem abrir nenhum app.
 *
 * Roda com a chave pública (a mesma que os apps usam), então checa exatamente
 * o que eles vão encontrar: a URL responde, o schema existe, o RLS está de pé e
 * as funções de estatística não estão abertas para quem não fez login.
 *
 *     node scripts/checar-supabase.mjs
 *
 * Sai com código 1 se qualquer verificação falhar — dá para usar em CI.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- .env ------------------------------------------------------------------

function lerEnv() {
  let bruto;
  try {
    bruto = readFileSync(resolve(raiz, '.env'), 'utf8');
  } catch {
    return {};
  }
  const saida = {};
  for (const linha of bruto.split('\n')) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith('#')) continue;
    const igual = limpa.indexOf('=');
    if (igual < 0) continue;
    saida[limpa.slice(0, igual).trim()] = limpa.slice(igual + 1).trim();
  }
  return saida;
}

const env = { ...lerEnv(), ...process.env };
const url = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const chave =
  env.SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

// --- Relatório -------------------------------------------------------------

let falhas = 0;

function ok(titulo, detalhe = '') {
  console.log(`  \x1b[32mok\x1b[0m   ${titulo}${detalhe ? ` — ${detalhe}` : ''}`);
}

function info(titulo, detalhe = '') {
  console.log(`  \x1b[36minfo\x1b[0m ${titulo}${detalhe ? ` — ${detalhe}` : ''}`);
}

function falha(titulo, detalhe = '') {
  falhas += 1;
  console.log(`  \x1b[31mFALHA\x1b[0m ${titulo}${detalhe ? ` — ${detalhe}` : ''}`);
}

console.log('\n🌸 Planner Fofo — checagem do Supabase\n');

if (!url || !chave) {
  falha(
    'variáveis de ambiente',
    'faltam SUPABASE_URL / SUPABASE_ANON_KEY. Copie .env.example para .env.',
  );
  process.exit(1);
}

ok('variáveis de ambiente', url);

const supabase = createClient(url, chave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- Schema e RLS ----------------------------------------------------------

const TABELAS = ['perfis', 'habitos', 'habito_registros', 'tags', 'itens'];

for (const tabela of TABELAS) {
  const { data, error } = await supabase.from(tabela).select('*').limit(1);

  if (error) {
    // 42P01 = relação inexistente: migração não aplicada.
    const dica =
      error.code === '42P01'
        ? 'tabela não existe — rode as migrações (npm run db:push)'
        : error.message;
    falha(`tabela ${tabela}`, dica);
    continue;
  }

  // Sem sessão, o RLS tem que devolver zero linhas — nunca um vazamento.
  if (data.length > 0) {
    falha(`RLS em ${tabela}`, `${data.length} linha(s) visível(is) sem login`);
  } else {
    ok(`tabela ${tabela}`, 'existe e o RLS bloqueia anônimo');
  }
}

// --- Funções de estatística ------------------------------------------------

// Foram revogadas de `anon` de propósito: dependem de auth.uid().
const RPCS = [
  ['pct_do_dia', { p_data: '2026-01-01' }],
  ['resumo_periodo', { p_inicio: '2026-01-01', p_fim: '2026-01-07' }],
  ['consistencia', { p_inicio: '2026-01-01', p_fim: '2026-01-07' }],
  ['streak_atual', {}],
];

for (const [nome, args] of RPCS) {
  const { error } = await supabase.rpc(nome, args);

  if (!error) {
    falha(`rpc ${nome}`, 'executou sem login — o revoke de `anon` não pegou');
    continue;
  }
  // 42883 = função inexistente. Qualquer outro erro aqui é a permissão negando,
  // que é justamente o comportamento esperado.
  if (error.code === '42883' || /does not exist/i.test(error.message)) {
    falha(`rpc ${nome}`, 'função não existe — rode as migrações');
  } else {
    ok(`rpc ${nome}`, 'existe e nega acesso anônimo');
  }
}

// --- Estado do cadastro ----------------------------------------------------
//
// `/auth/v1/settings` é público e diz se a confirmação de e-mail está ligada.
// Não é pass/fail — serve para quem vai testar saber o que esperar da tela de
// cadastro, em vez de achar que quebrou quando a conta não loga direto.

const AJUDA_CONFIRMACAO = [
  'confirmação de e-mail LIGADA — a conta é criada mas não loga',
  '         desligue em Authentication → Sign In / Providers → Email → Confirm email,',
  '         ou confirme na mão no SQL Editor:',
  '         update auth.users set email_confirmed_at = now() where email_confirmed_at is null;',
].join('\n');

try {
  const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: chave } });
  const s = await r.json();

  if (s.disable_signup) {
    info('cadastro', 'DESABILITADO no projeto — a tela de criar conta vai falhar');
  } else if (s.mailer_autoconfirm) {
    info('cadastro', 'confirmação de e-mail desligada — cria a conta e já entra');
  } else {
    info('cadastro', AJUDA_CONFIRMACAO);
  }
} catch {
  info('cadastro', 'não consegui ler /auth/v1/settings (não impede o app de rodar)');
}

// --- Fim -------------------------------------------------------------------

console.log('');
if (falhas) {
  console.log(`\x1b[31m${falhas} verificação(ões) falharam.\x1b[0m\n`);
  process.exit(1);
}
console.log('\x1b[32mBackend de pé. 💗\x1b[0m\n');
