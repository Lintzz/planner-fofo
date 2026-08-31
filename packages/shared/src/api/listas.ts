/** Acesso as listas sem pressao (Estudos e Avulsas) e as suas tags. */

import type { ClientePlanner } from '../supabase';
import { exigirUsuaria } from '../supabase';
import type { LinhaItem, LinhaTag, ListaTipo } from '../database.types';
import type { Item, RascunhoItem, Tag } from '../types';
import type { ChavePaleta } from '../theme';
import { hoje } from '../lib/datas';

const tagDaLinha = (linha: LinhaTag): Tag => ({
  id: linha.id,
  lista: linha.lista,
  nome: linha.nome,
  cor: linha.cor as ChavePaleta,
});

const itemDaLinha = (linha: LinhaItem): Item => ({
  id: linha.id,
  lista: linha.lista,
  texto: linha.texto,
  tagId: linha.tag_id,
  feito: linha.feito,
  data: linha.data,
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

/** Tags de uma lista, na ordem de criacao. */
export async function listarTags(cliente: ClientePlanner, lista: ListaTipo): Promise<Tag[]> {
  const { data, error } = await cliente
    .from('tags')
    .select('*')
    .eq('lista', lista)
    .order('criado_em', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(tagDaLinha);
}

/**
 * Cria uma tag. Se ja existir uma com o mesmo nome (ignorando maiusculas),
 * devolve a existente em vez de falhar — o design trata os dois casos igual.
 */
export async function criarTag(
  cliente: ClientePlanner,
  lista: ListaTipo,
  nome: string,
  cor: ChavePaleta,
): Promise<Tag | null> {
  const usuarioId = await exigirUsuaria(cliente);
  const limpo = nome.trim();
  if (!limpo) return null;

  const { data, error } = await cliente
    .from('tags')
    .insert({ usuario_id: usuarioId, lista, nome: limpo, cor })
    .select()
    .single();

  // 23505 = violacao de unicidade (o indice `tags_nome_unico_idx`).
  if (error?.code === '23505') {
    const existentes = await listarTags(cliente, lista);
    return existentes.find((t) => t.nome.toLowerCase() === limpo.toLowerCase()) ?? null;
  }
  if (error) throw error;
  return tagDaLinha(data);
}

/**
 * Apaga uma tag. Os itens que a usavam continuam existindo, sem categoria
 * (`on delete set null`).
 */
export async function excluirTag(cliente: ClientePlanner, id: string): Promise<void> {
  const { error } = await cliente.from('tags').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------

/** Todos os itens de uma lista (a filtragem por escopo/tag e feita no cliente). */
export async function listarItens(cliente: ClientePlanner, lista: ListaTipo): Promise<Item[]> {
  const { data, error } = await cliente
    .from('itens')
    .select('*')
    .eq('lista', lista)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(itemDaLinha);
}

/** Adiciona um item. Devolve `null` quando o texto esta vazio. */
export async function criarItem(
  cliente: ClientePlanner,
  rascunho: RascunhoItem,
): Promise<Item | null> {
  const usuarioId = await exigirUsuaria(cliente);
  const texto = rascunho.texto.trim();
  if (!texto) return null;

  const { data, error } = await cliente
    .from('itens')
    .insert({
      usuario_id: usuarioId,
      lista: rascunho.lista,
      texto,
      tag_id: rascunho.tagId,
      data: rascunho.data || hoje(),
    })
    .select()
    .single();

  if (error) throw error;
  return itemDaLinha(data);
}

/**
 * Regrava texto, tag e dia de um item existente. Devolve `null` quando o texto
 * esta vazio — mesma regra do `criarItem`.
 */
export async function atualizarItem(
  cliente: ClientePlanner,
  id: string,
  rascunho: RascunhoItem,
): Promise<Item | null> {
  const texto = rascunho.texto.trim();
  if (!texto) return null;

  const { data, error } = await cliente
    .from('itens')
    .update({ texto, tag_id: rascunho.tagId, data: rascunho.data || hoje() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return itemDaLinha(data);
}

/** Marca ou desmarca um item. */
export async function alternarItem(
  cliente: ClientePlanner,
  id: string,
  feito: boolean,
): Promise<void> {
  const { error } = await cliente.from('itens').update({ feito }).eq('id', id);
  if (error) throw error;
}

/** Remove um item da lista. */
export async function excluirItem(cliente: ClientePlanner, id: string): Promise<void> {
  const { error } = await cliente.from('itens').delete().eq('id', id);
  if (error) throw error;
}
