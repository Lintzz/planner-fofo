/**
 * Ponte entre o processo principal e a janela.
 *
 * O Planner Fofo fala direto com o Supabase pela rede, entao o renderer nao
 * precisa de nenhuma capacidade de Node. O que e exposto aqui e so metadado
 * de plataforma, util para ajustes de layout e para a tela de diagnostico.
 */
import { contextBridge } from 'electron';

const api = {
  plataforma: process.platform,
  versoes: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
} as const;

contextBridge.exposeInMainWorld('plannerFofo', api);

export type ApiPlannerFofo = typeof api;
