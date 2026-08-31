/**
 * Cliente Supabase do app mobile.
 *
 * A configuração (URL, chave, refresh, headers) mora em `@planner-fofo/shared`.
 * Aqui só entra o que é específico do React Native: AsyncStorage para guardar a
 * sessão e o polyfill de URL. A opção `lock` foi removida de propósito: o
 * supabase-js 2.112 a depreciou (sai na v3) porque o cliente já coordena o
 * refresh sozinho — mantê-la só rendia um aviso amarelo na tela.
 *
 * O cliente é criado **sob demanda**, nunca no topo do módulo. Sem ambiente
 * configurado `obterCliente()` lança, e no topo do módulo isso aconteceria
 * durante o `import` — antes de qualquer React rodar, virando red box em vez
 * da tela "Falta configurar o Supabase".
 */
import { setupURLPolyfill } from 'react-native-url-polyfill';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { definirAmbiente, obterCliente, type ClientePlanner } from '@planner-fofo/shared';

// O `.env` vive na raiz do monorepo; o `app.config.js` o lê e repassa por
// `extra`. É o espelho do que o desktop faz com `import.meta.env`.
const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

definirAmbiente({
  supabaseUrl: extra.supabaseUrl,
  supabaseAnonKey: extra.supabaseAnonKey,
});

let instancia: ClientePlanner | null = null;

/** Cliente singleton. Só chame depois de `ambienteConfigurado()`. */
export function obterSupabase(): ClientePlanner {
  if (instancia) return instancia;

  // O polyfill de URL tem de ser instalado AQUI, e nao no topo do modulo.
  //
  // O `supabase-js` faz `realtimeUrl.protocol = ...` ao montar o cliente, e o
  // `URL` que vem no React Native so tem getter de `protocol`. O polyfill
  // resolve — mas so se for o ultimo a falar.
  //
  // O problema e que o RN reinstala o proprio `URL` **durante o
  // `runApplication`**, depois de todo modulo de entry ja ter rodado
  // (`polyfillGlobal` <- `setUpDefaltReactNativeEnvironment`), e ainda por cima
  // como getter preguicoso: o valor real so materializa no primeiro acesso.
  // Resultado: `import 'react-native-url-polyfill/auto'` no topo de qualquer
  // modulo — inclusive do index.js — e sobrescrito depois, e o app morre no
  // primeiro render com:
  //
  //     TypeError: Cannot assign to property 'protocol' which has only a getter
  //
  // Isso so acontece no build de release; em debug o bundle e montado de outro
  // jeito e o erro nao aparece. Chamando aqui, ja dentro do render, o polyfill
  // fica sendo o ultimo a escrever — e nada depois dele mexe no global.
  setupURLPolyfill();

  instancia = obterCliente({
    storage: AsyncStorage,
    detectarSessaoNaUrl: false,
    nomeCliente: 'planner-fofo-mobile',
  });

  // Mantém o token renovado enquanto o app está em primeiro plano.
  // Registrado junto do cliente para não assinar o evento à toa quando o
  // ambiente não está configurado.
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      void instancia?.auth.startAutoRefresh();
    } else {
      void instancia?.auth.stopAutoRefresh();
    }
  });

  return instancia;
}
