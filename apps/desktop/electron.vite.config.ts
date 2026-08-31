import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// O .env fica na raiz do monorepo, compartilhado com o app mobile.
const raizMonorepo = resolve(__dirname, '../..');

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
    // Le o .env da raiz e injeta apenas o que comeca com VITE_.
    envDir: raizMonorepo,
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        // O shared e consumido como TypeScript e transpilado junto.
        '@planner-fofo/shared': resolve(raizMonorepo, 'packages/shared/src/index.ts'),
      },
    },
    server: {
      fs: {
        // Permite ao Vite servir arquivos de fora de apps/desktop (packages/shared).
        allow: [raizMonorepo],
      },
    },
  },
});
