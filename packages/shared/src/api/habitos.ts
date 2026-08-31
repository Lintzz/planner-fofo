/** Acesso aos habitos fixos e aos seus registros de conclusao. */

import type { ClientePlanner } from '../supabase';
import { exigirUsuaria } from '../supabase';
import type { LinhaHabito } from '../database.types';
import type { Habito, HabitoDaSemana, RascunhoHabito } from '../types';
import type { ChavePaleta } from '../theme';
import { fimDaSemana, hoje, indiceDia, inicioDaSemana } from '../lib/datas';
import { normalizarAgenda } from '../lib/regras';

/**
 * Converte a linha do Postgres no modelo do cliente.
 *
 * A agenda e um `boolean[7]` nos dois lados. No Postgres o indice 1 e segunda
 * (para casar com `isodow`); ao chegar em JS o mesmo elemento vira indice 0,
 * entao a conversao e so garantir o tamanho.
 */
function daLinha(linha: LinhaHabito): Habito {
  return {
    id: linha.id,
    nome: linha.nome,
    emoji: linha.emoji,
    cor: linha.cor as ChavePaleta,
    agenda: Array.from({ length: 7 }, (_, i) => Boolean(linha.agenda?.[i])),
    ordem: linha.ordem,
    arquivado: linha.arquivado,
    criadoEm: linha.criado_em,
  };
}

/** Habitos ativos, na ordem em que aparecem na tela. */
export async function listarHabitos(cliente: ClientePlanner): Promise<Habito[]> {
  const { data, error } = await cliente
    .from('habitos')
    .select('*')
    .eq('arquivado', false)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(daLinha);
}

/**
 * Habitos com as conclusoes da semana de `referencia` — o que a aba Hoje
 * precisa para desenhar as barrinhas de segunda a domingo.
 */
export async function listarHabitosDaSemana(
  cliente: ClientePlanner,
  referencia: string = hoje(),
): Promise<HabitoDaSemana[]> {
  const inicio = inicioDaSemana(referencia);
  const fim = fimDaSemana(referencia);

  const [habitos, registros] = await Promise.all([
    listarHabitos(cliente),
    cliente
      .from('habito_registros')
      .select('habito_id, data')
      .gte('data', inicio)
      .lte('data', fim),
  ]);

  if (registros.error) throw registros.error;

  const porHabito = new Map<string, Set<number>>();
  for (const registro of registros.data ?? []) {
    const dias = porHabito.get(registro.habito_id) ?? new Set<number>();
    dias.add(indiceDia(registro.data));
    porHabito.set(registro.habito_id, dias);
  }

  return habitos.map((habito) => {
    const dias = porHabito.get(habito.id);
    return {
      ...habito,
      semana: Array.from({ length: 7 }, (_, i) => Boolean(dias?.has(i))),
    };
  });
}

/**
 * Marca ou desmarca um habito num dia.
 *
 * O registro existe apenas quando o habito foi feito, entao desmarcar apaga a
 * linha. Devolve o novo estado para a tela nao precisar recarregar tudo.
 */
export async function alternarHabito(
  cliente: ClientePlanner,
  habitoId: string,
  data: string = hoje(),
): Promise<boolean> {
  const usuarioId = await exigirUsuaria(cliente);

  const { data: existente, error: erroBusca } = await cliente
    .from('habito_registros')
    .select('id')
    .eq('habito_id', habitoId)
    .eq('data', data)
    .maybeSingle();

  if (erroBusca) throw erroBusca;

  if (existente) {
    const { error } = await cliente.from('habito_registros').delete().eq('id', existente.id);
    if (error) throw error;
    return false;
  }

  const { error } = await cliente
    .from('habito_registros')
    .insert({ habito_id: habitoId, usuario_id: usuarioId, data });
  if (error) throw error;
  return true;
}

/** Cria ou atualiza um habito a partir do rascunho da folha de edicao. */
export async function salvarHabito(
  cliente: ClientePlanner,
  rascunho: RascunhoHabito,
): Promise<Habito> {
  const usuarioId = await exigirUsuaria(cliente);
  const nome = rascunho.nome.trim() || 'Novo hábito';
  const agenda = normalizarAgenda(rascunho.agenda);

  if (rascunho.id) {
    const { data, error } = await cliente
      .from('habitos')
      .update({ nome, emoji: rascunho.emoji, cor: rascunho.cor, agenda })
      .eq('id', rascunho.id)
      .select()
      .single();
    if (error) throw error;
    return daLinha(data);
  }

  // Novo habito entra no fim da lista.
  const { data: ultimo } = await cliente
    .from('habitos')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await cliente
    .from('habitos')
    .insert({
      usuario_id: usuarioId,
      nome,
      emoji: rascunho.emoji,
      cor: rascunho.cor,
      agenda,
      ordem: (ultimo?.ordem ?? -1) + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return daLinha(data);
}

/**
 * Apaga um habito e todo o seu historico (`on delete cascade` nos registros).
 * Para preservar as estatisticas passadas, use `arquivarHabito`.
 */
export async function excluirHabito(cliente: ClientePlanner, id: string): Promise<void> {
  const { error } = await cliente.from('habitos').delete().eq('id', id);
  if (error) throw error;
}

/** Tira o habito da rotina sem perder o historico ja registrado. */
export async function arquivarHabito(cliente: ClientePlanner, id: string): Promise<void> {
  const { error } = await cliente.from('habitos').update({ arquivado: true }).eq('id', id);
  if (error) throw error;
}
