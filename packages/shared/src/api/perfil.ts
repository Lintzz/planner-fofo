/** Perfil e autenticacao. */

import type { ClientePlanner } from '../supabase';
import { exigirUsuaria } from '../supabase';
import type { LinhaPerfil } from '../database.types';
import type { Perfil } from '../types';

const daLinha = (linha: LinhaPerfil): Perfil => ({
  id: linha.id,
  nome: linha.nome,
  acento: linha.acento,
  progressoCircular: linha.progresso_circular,
  comemoracao: linha.comemoracao,
});

/** Perfil da usuaria logada. `null` quando nao ha sessao. */
export async function carregarPerfil(cliente: ClientePlanner): Promise<Perfil | null> {
  const { data: sessao } = await cliente.auth.getUser();
  if (!sessao.user) return null;

  const { data, error } = await cliente
    .from('perfis')
    .select('*')
    .eq('id', sessao.user.id)
    .maybeSingle();

  if (error) throw error;
  return data ? daLinha(data) : null;
}

/** Atualiza preferencias. Aceita alteracao parcial. */
export async function salvarPerfil(
  cliente: ClientePlanner,
  mudancas: Partial<Omit<Perfil, 'id'>>,
): Promise<Perfil> {
  const usuarioId = await exigirUsuaria(cliente);

  const { data, error } = await cliente
    .from('perfis')
    .update({
      ...(mudancas.nome !== undefined ? { nome: mudancas.nome } : {}),
      ...(mudancas.acento !== undefined ? { acento: mudancas.acento } : {}),
      ...(mudancas.progressoCircular !== undefined
        ? { progresso_circular: mudancas.progressoCircular }
        : {}),
      ...(mudancas.comemoracao !== undefined ? { comemoracao: mudancas.comemoracao } : {}),
    })
    .eq('id', usuarioId)
    .select()
    .single();

  if (error) throw error;
  return daLinha(data);
}

/** Login com e-mail e senha. */
export async function entrar(
  cliente: ClientePlanner,
  email: string,
  senha: string,
): Promise<void> {
  const { error } = await cliente.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });
  if (error) throw error;
}

/**
 * Cria a conta. O gatilho `ao_criar_usuaria` ja monta perfil, habitos de
 * exemplo e tags iniciais, entao a usuaria cai num app cheinho.
 */
export async function cadastrar(
  cliente: ClientePlanner,
  email: string,
  senha: string,
  nome: string,
): Promise<void> {
  const { error } = await cliente.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { nome: nome.trim() } },
  });
  if (error) throw error;
}

/** Encerra a sessao. */
export async function sair(cliente: ClientePlanner): Promise<void> {
  const { error } = await cliente.auth.signOut();
  if (error) throw error;
}
