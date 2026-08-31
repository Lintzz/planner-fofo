/**
 * Cliente Supabase centralizado.
 *
 * Mobile e desktop compartilham esta fabrica; cada um so injeta o adaptador de
 * armazenamento da sua plataforma (AsyncStorage no React Native, localStorage
 * no Electron/Chromium).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { obterAmbiente } from './env';
import type { Database } from './database.types';

export type ClientePlanner = SupabaseClient<Database>;

/** Formato de storage aceito pelo supabase-js (sincrono ou assincrono). */
export interface StorageAuth {
  getItem: (chave: string) => string | null | Promise<string | null>;
  setItem: (chave: string, valor: string) => void | Promise<void>;
  removeItem: (chave: string) => void | Promise<void>;
}

export interface OpcoesCliente {
  /** Onde persistir a sessao. Sem isso a sessao vive so na memoria. */
  storage?: StorageAuth;
  /**
   * Ler a sessao a partir da URL. `true` apenas em fluxos OAuth no navegador;
   * `false` em React Native e nas janelas do Electron.
   */
  detectarSessaoNaUrl?: boolean;
  /** Identifica a plataforma nos logs do Supabase. */
  nomeCliente?: string;
}

let instancia: ClientePlanner | null = null;

/** Cria um cliente novo. Prefira `obterCliente()` no codigo de aplicacao. */
export function criarClienteSupabase(opcoes: OpcoesCliente = {}): ClientePlanner {
  const { supabaseUrl, supabaseAnonKey } = obterAmbiente();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      ...(opcoes.storage ? { storage: opcoes.storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: opcoes.detectarSessaoNaUrl ?? false,
    },
    global: {
      headers: { 'x-client-info': opcoes.nomeCliente ?? 'planner-fofo' },
    },
  });
}

/**
 * Cliente singleton do processo. A primeira chamada configura; as seguintes
 * reaproveitam — evita multiplas conexoes realtime e sessoes concorrentes.
 */
export function obterCliente(opcoes: OpcoesCliente = {}): ClientePlanner {
  if (!instancia) instancia = criarClienteSupabase(opcoes);
  return instancia;
}

/** Descarta o singleton. Util em testes e ao trocar de ambiente. */
export function reiniciarCliente(): void {
  instancia = null;
}

/** Id da usuaria logada, ou `null`. */
export async function usuariaAtual(cliente: ClientePlanner): Promise<string | null> {
  const { data } = await cliente.auth.getUser();
  return data.user?.id ?? null;
}

/** Igual a `usuariaAtual`, mas lanca quando nao ha sessao. */
export async function exigirUsuaria(cliente: ClientePlanner): Promise<string> {
  const id = await usuariaAtual(cliente);
  if (!id) throw new Error('Planner Fofo: nenhuma sessao ativa. Faca login primeiro.');
  return id;
}
