/**
 * @planner-fofo/shared
 *
 * Nucleo compartilhado entre o app mobile (Expo) e o desktop (Electron/Vite):
 * ambiente, cliente Supabase, design tokens, tipos, regras de negocio e a
 * camada de dados. Nada aqui importa React, React Native ou Electron.
 */

export * from './env';
export * from './supabase';
export * from './theme';
export * from './types';
export type { Database, Json } from './database.types';

export * from './lib/datas';
export * from './lib/regras';

export * from './api/habitos';
export * from './api/listas';
export * from './api/estatisticas';
export * from './api/perfil';

// O hook de estado exige React; por isso fica num sub-caminho proprio,
// importavel como "@planner-fofo/shared/react".
export * from './react/usePlanner';
