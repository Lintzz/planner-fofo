// Metro num monorepo npm workspaces: precisa enxergar os pacotes fora de
// apps/mobile e resolver dependencias tanto no node_modules local quanto no da
// raiz. Sem isso, `@planner-fofo/shared` nao e encontrado.
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

// O `serverRoot` volta a ser o proprio app, e nao a raiz do monorepo.
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
