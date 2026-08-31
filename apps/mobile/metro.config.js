// Metro num monorepo npm workspaces: precisa enxergar os pacotes fora de
// apps/mobile e resolver dependencias tanto no node_modules local quanto no da
// raiz. Sem isso, `@planner-fofo/shared` nao e encontrado.

// Raiz do Metro fixada no proprio app, e nao na raiz do monorepo.
//
// Isto precisa ser dito duas vezes porque quem le a raiz sao dois lados que
// nao conversam, e cada um so entende um dos jeitos:
//
//   1. O **Expo CLI** decide sozinho, em `getMetroServerRoot()`
//      (@expo/config/build/paths/paths.js), e la ele so olha esta variavel de
//      ambiente — ignora o `unstable_serverRoot` do config. Sem ela, o
//      manifesto do dev server anuncia `apps/mobile/index.bundle` enquanto o
//      Metro serve com raiz em `apps/mobile`, e o dev-client morre com
//      `Unable to resolve module ./apps/mobile/index`.
//   2. O **Metro** olha `config.server.unstable_serverRoot`, la embaixo.
//
// A variavel e setada aqui, antes do require, porque assim vale tanto para
// `expo start` quanto para `expo run:android` sem depender de quem digitou o
// comando. No `export:embed` (o bundle de release, chamado pelo Gradle) ela
// chega tarde: o entry ja foi resolvido quando este arquivo carrega. Por isso
// o pin la embaixo continua necessario — ele nao e redundante.
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const raizProjeto = __dirname;
const raizMonorepo = path.resolve(raizProjeto, '../..');

const config = getDefaultConfig(raizProjeto);

config.watchFolders = [raizMonorepo];
config.resolver.nodeModulesPaths = [
  path.resolve(raizProjeto, 'node_modules'),
  path.resolve(raizMonorepo, 'node_modules'),
];

// O outro lado: o serverRoot que o **Metro** enxerga.
//
// Ao detectar o workspace, o `expo/metro-config` sobe o serverRoot para a raiz.
// No build de release isso quebra o bundle: o plugin Gradle do React Native
// chama `export:embed --entry-file index.js` com caminho **relativo** (o
// working directory e apps/mobile), mas o Metro resolve relativo ao serverRoot
// — e ia procurar o entry na raiz do monorepo, onde ele nao existe:
//
//     None of these files exist: ..\..\index.js
//
// O modo debug nunca mostra isso porque o bundle vem do dev server, nao daqui.
// `watchFolders` acima continua dando acesso a packages/shared.
config.server = { ...config.server, unstable_serverRoot: raizProjeto };

module.exports = config;
