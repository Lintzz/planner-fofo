/**
 * Configuração do Expo, montada em cima do `app.json`.
 *
 * Existe por um motivo só: o Expo lê `.env` a partir do diretório do app, e o
 * nosso mora na **raiz do monorepo**, compartilhado com o desktop. Sem isto,
 * `process.env.EXPO_PUBLIC_*` chega vazio no bundle e o app abre com red box
 * dizendo que faltam as variáveis.
 *
 * Aqui o `.env` da raiz é lido na hora em que a CLI monta a config, e os
 * valores seguem para o app por `extra` — que `expo-constants` entrega em
 * runtime. É o espelho exato do que o desktop faz com `envDir` no Vite.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ_MONOREPO = path.resolve(__dirname, '../..');

/** Parser mínimo de `.env` — evita puxar `dotenv` só para isto. */
function lerEnvDaRaiz() {
  const arquivo = path.join(RAIZ_MONOREPO, '.env');
  let bruto;
  try {
    bruto = fs.readFileSync(arquivo, 'utf8');
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

module.exports = ({ config }) => {
  const doArquivo = lerEnvDaRaiz();
  // Variável já exportada no shell tem prioridade sobre o arquivo.
  const env = { ...doArquivo, ...process.env };

  const supabaseUrl =
    env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey =
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    // Aviso na saída da CLI, não erro: o app tem tela própria para este caso.
    console.warn(
      '\n⚠️  Planner Fofo: não achei SUPABASE_URL / SUPABASE_ANON_KEY em ' +
        path.join(RAIZ_MONOREPO, '.env') +
        '.\n   O app vai abrir na tela "Falta configurar o Supabase".\n',
    );
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      // Assina o APK de release com a chave de verdade, e nao com a de debug
      // que vem no template. Ver plugins/assinatura-android.js.
      './plugins/assinatura-android',
    ],
    extra: {
      ...config.extra,
      supabaseUrl,
      supabaseAnonKey,
    },
  };
};
