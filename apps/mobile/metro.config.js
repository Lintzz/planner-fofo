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
module.exports = config;
