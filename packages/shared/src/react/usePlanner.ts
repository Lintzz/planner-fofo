/**
 * Estado do planner.
 *
 * Este hook nao renderiza nada e nao importa React Native nem DOM — so React.
 * Mobile e desktop consomem o mesmo estado e as mesmas acoes, e cada um decide
 * como desenhar. E o que garante que os dois apps se comportem igual.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import type { ClientePlanner } from '../supabase';
import {
  alternarHabito as apiAlternarHabito,
  excluirHabito as apiExcluirHabito,
  listarHabitosDaSemana,
  salvarHabito as apiSalvarHabito,
} from '../api/habitos';
import {
  alternarItem as apiAlternarItem,
  criarItem as apiCriarItem,
  criarTag as apiCriarTag,
  excluirItem as apiExcluirItem,
  excluirTag as apiExcluirTag,
  listarItens,
  listarTags,
} from '../api/listas';
import { carregarEstatisticas, streakAtual, type PainelEstatisticas } from '../api/estatisticas';
import { carregarPerfil } from '../api/perfil';
import type { ChavePaleta } from '../theme';
import type {
  Aba,
  Escopo,
  HabitoDaSemana,
  Item,
  ListaTipo,
  Perfil,
  Periodo,
  RascunhoHabito,
  RascunhoItem,
  Tag,
} from '../types';
import { hoje, indiceDia } from '../lib/datas';
import {
  agruparPorData,
  feitosDeHoje,
  filtrarItens,
  porcentagemDoDia,
  rascunhoDe,
  rascunhoNovo,
} from '../lib/regras';

interface EstadoLista {
  tags: Tag[];
  itens: Item[];
  escopo: Escopo;
  filtroTagId: string | null;
}

const listaVazia = (): EstadoLista => ({ tags: [], itens: [], escopo: 'hoje', filtroTagId: null });

/** Qual das duas listas a aba atual mostra. */
const listaDaAba = (aba: Aba): ListaTipo => (aba === 'estudos' ? 'estudos' : 'tarefas');

export function usePlanner(cliente: ClientePlanner) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [autenticando, setAutenticando] = useState(true);

  const [aba, setAba] = useState<Aba>('hoje');
  const [periodo, setPeriodo] = useState<Periodo>('Semana');

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [habitos, setHabitos] = useState<HabitoDaSemana[]>([]);
  const [listas, setListas] = useState<Record<ListaTipo, EstadoLista>>({
    estudos: listaVazia(),
    tarefas: listaVazia(),
  });
  const [estatisticas, setEstatisticas] = useState<PainelEstatisticas | null>(null);
  // A sequencia aparece no cabecalho de todas as abas, entao e carregada junto
  // com o resto — nao so quando a aba Graficos abre.
  const [streak, setStreak] = useState(0);

  const [rascunho, setRascunho] = useState<RascunhoHabito | null>(null);
  const [rascunhoItem, setRascunhoItem] = useState<RascunhoItem | null>(null);
  const [comemorando, setComemorando] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const indice = indiceDia();

  // --- Sessao --------------------------------------------------------------

  useEffect(() => {
    let vivo = true;

    void cliente.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSessao(data.session);
      setAutenticando(false);
    });

    const { data: assinatura } = cliente.auth.onAuthStateChange((_evento, nova) => {
      setSessao(nova);
      setAutenticando(false);
    });

    return () => {
      vivo = false;
      assinatura.subscription.unsubscribe();
    };
  }, [cliente]);

  // --- Carga inicial -------------------------------------------------------

  const recarregar = useCallback(async () => {
    if (!sessao) return;
    setErro(null);
    try {
      const [
        novoPerfil,
        novosHabitos,
        tagsEstudos,
        itensEstudos,
        tagsTarefas,
        itensTarefas,
        novoStreak,
      ] = await Promise.all([
        carregarPerfil(cliente),
        listarHabitosDaSemana(cliente),
        listarTags(cliente, 'estudos'),
        listarItens(cliente, 'estudos'),
        listarTags(cliente, 'tarefas'),
        listarItens(cliente, 'tarefas'),
        streakAtual(cliente),
      ]);

      setPerfil(novoPerfil);
      setStreak(novoStreak);
      setHabitos(novosHabitos);
      setListas((atual) => ({
        estudos: { ...atual.estudos, tags: tagsEstudos, itens: itensEstudos },
        tarefas: { ...atual.tarefas, tags: tagsTarefas, itens: itensTarefas },
      }));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }, [cliente, sessao]);

  useEffect(() => {
    if (!sessao) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    void recarregar();
  }, [sessao, recarregar]);

  // Estatisticas sao recarregadas ao entrar na aba, trocar de periodo ou
  // marcar um habito — nao a cada render.
  const recarregarEstatisticas = useCallback(async () => {
    if (!sessao) return;
    try {
      setEstatisticas(await carregarEstatisticas(cliente, periodo));
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [cliente, sessao, periodo]);

  useEffect(() => {
    if (aba === 'stats') void recarregarEstatisticas();
  }, [aba, recarregarEstatisticas]);

  // --- Habitos -------------------------------------------------------------

  const alternarHabito = useCallback(
    async (id: string) => {
      // Atualizacao otimista: o toque tem que responder na hora.
      let virouCompleto = false;
      setHabitos((atual) => {
        const proximo = atual.map((h) =>
          h.id === id
            ? { ...h, semana: h.semana.map((v, i) => (i === indice ? !v : v)) }
            : h,
        );
        virouCompleto = porcentagemDoDia(proximo, indice) === 100;
        return proximo;
      });

      try {
        await apiAlternarHabito(cliente, id, hoje());
        if (virouCompleto && (perfil?.comemoracao ?? true)) {
          setComemorando(true);
          setTimeout(() => setComemorando(false), 4200);
        }
        // A sequencia pode ter mudado com esta marcacao.
        setStreak(await streakAtual(cliente));
        if (aba === 'stats') void recarregarEstatisticas();
      } catch (e) {
        setErro(mensagemDeErro(e));
        void recarregar(); // desfaz o otimismo trazendo a verdade do banco
      }
    },
    [cliente, indice, perfil, aba, recarregarEstatisticas, recarregar],
  );

  const abrirNovoHabito = useCallback(() => setRascunho(rascunhoNovo()), []);
  const abrirEdicaoHabito = useCallback(
    (id: string) => {
      const alvo = habitos.find((h) => h.id === id);
      if (alvo) setRascunho(rascunhoDe(alvo));
    },
    [habitos],
  );
  const fecharRascunho = useCallback(() => setRascunho(null), []);
  const mudarRascunho = useCallback(
    (mudanca: Partial<RascunhoHabito>) =>
      setRascunho((atual) => (atual ? { ...atual, ...mudanca } : atual)),
    [],
  );
  const alternarDiaDoRascunho = useCallback(
    (dia: number) =>
      setRascunho((atual) =>
        atual ? { ...atual, agenda: atual.agenda.map((v, i) => (i === dia ? !v : v)) } : atual,
      ),
    [],
  );

  const salvarRascunho = useCallback(async () => {
    if (!rascunho) return;
    try {
      await apiSalvarHabito(cliente, rascunho);
      setRascunho(null);
      await recarregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [cliente, rascunho, recarregar]);

  const excluirDoRascunho = useCallback(async () => {
    if (!rascunho?.id) return;
    try {
      await apiExcluirHabito(cliente, rascunho.id);
      setRascunho(null);
      await recarregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [cliente, rascunho, recarregar]);

  // --- Listas --------------------------------------------------------------

  const listaAtual = listaDaAba(aba);
  const estadoLista = listas[listaAtual];

  const mudarLista = useCallback(
    (lista: ListaTipo, mudanca: Partial<EstadoLista>) =>
      setListas((atual) => ({ ...atual, [lista]: { ...atual[lista], ...mudanca } })),
    [],
  );

  const definirEscopo = useCallback(
    (escopo: Escopo) => mudarLista(listaAtual, { escopo }),
    [mudarLista, listaAtual],
  );

  const definirFiltro = useCallback(
    (tagId: string | null) =>
      // Selecionar uma tag leva para o historico: e onde o filtro faz sentido.
      mudarLista(listaAtual, tagId ? { filtroTagId: tagId, escopo: 'tudo' } : { filtroTagId: null }),
    [mudarLista, listaAtual],
  );

  const abrirNovoItem = useCallback(() => {
    setRascunhoItem({
      lista: listaAtual,
      texto: '',
      tagId: estadoLista.filtroTagId ?? estadoLista.tags[0]?.id ?? null,
      data: hoje(),
    });
  }, [listaAtual, estadoLista]);

  const fecharRascunhoItem = useCallback(() => setRascunhoItem(null), []);
  const mudarRascunhoItem = useCallback(
    (mudanca: Partial<RascunhoItem>) =>
      setRascunhoItem((atual) => (atual ? { ...atual, ...mudanca } : atual)),
    [],
  );

  const salvarItem = useCallback(async () => {
    if (!rascunhoItem) return;
    try {
      const criado = await apiCriarItem(cliente, rascunhoItem);
      if (!criado) return;
      mudarLista(rascunhoItem.lista, { itens: [criado, ...listas[rascunhoItem.lista].itens] });
      setRascunhoItem(null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [cliente, rascunhoItem, listas, mudarLista]);

  const alternarItem = useCallback(
    async (id: string) => {
      const lista = listaAtual;
      const alvo = listas[lista].itens.find((i) => i.id === id);
      if (!alvo) return;
      mudarLista(lista, {
        itens: listas[lista].itens.map((i) => (i.id === id ? { ...i, feito: !i.feito } : i)),
      });
      try {
        await apiAlternarItem(cliente, id, !alvo.feito);
      } catch (e) {
        setErro(mensagemDeErro(e));
        mudarLista(lista, { itens: listas[lista].itens });
      }
    },
    [cliente, listaAtual, listas, mudarLista],
  );

  const excluirItem = useCallback(
    async (id: string) => {
      const lista = listaAtual;
      const antes = listas[lista].itens;
      mudarLista(lista, { itens: antes.filter((i) => i.id !== id) });
      try {
        await apiExcluirItem(cliente, id);
      } catch (e) {
        setErro(mensagemDeErro(e));
        mudarLista(lista, { itens: antes });
      }
    },
    [cliente, listaAtual, listas, mudarLista],
  );

  const criarTag = useCallback(
    async (nome: string, cor: ChavePaleta) => {
      const lista = rascunhoItem?.lista ?? listaAtual;
      try {
        const tag = await apiCriarTag(cliente, lista, nome, cor);
        if (!tag) return;
        const jaExiste = listas[lista].tags.some((t) => t.id === tag.id);
        mudarLista(lista, { tags: jaExiste ? listas[lista].tags : [...listas[lista].tags, tag] });
        setRascunhoItem((atual) => (atual ? { ...atual, tagId: tag.id } : atual));
      } catch (e) {
        setErro(mensagemDeErro(e));
      }
    },
    [cliente, rascunhoItem, listaAtual, listas, mudarLista],
  );

  const excluirTag = useCallback(
    async (id: string) => {
      const lista = rascunhoItem?.lista ?? listaAtual;
      // O design nao deixa a lista ficar sem nenhuma tag.
      if (listas[lista].tags.length <= 1) return;
      try {
        await apiExcluirTag(cliente, id);
        const restantes = listas[lista].tags.filter((t) => t.id !== id);
        mudarLista(lista, {
          tags: restantes,
          filtroTagId: listas[lista].filtroTagId === id ? null : listas[lista].filtroTagId,
          itens: listas[lista].itens.map((i) => (i.tagId === id ? { ...i, tagId: null } : i)),
        });
        setRascunhoItem((atual) =>
          atual && atual.tagId === id ? { ...atual, tagId: restantes[0]?.id ?? null } : atual,
        );
      } catch (e) {
        setErro(mensagemDeErro(e));
      }
    },
    [cliente, rascunhoItem, listaAtual, listas, mudarLista],
  );

  // --- Derivados -----------------------------------------------------------

  const pct = useMemo(() => porcentagemDoDia(habitos, indice), [habitos, indice]);
  const feitos = useMemo(() => feitosDeHoje(habitos, indice), [habitos, indice]);

  const itensVisiveis = useMemo(
    () =>
      filtrarItens(estadoLista.itens, {
        escopo: estadoLista.escopo,
        tagId: estadoLista.filtroTagId,
      }),
    [estadoLista],
  );

  const grupos = useMemo(() => agruparPorData(itensVisiveis), [itensVisiveis]);

  const tagPorId = useMemo(
    () => new Map(estadoLista.tags.map((t) => [t.id, t])),
    [estadoLista.tags],
  );

  return {
    // sessao
    sessao,
    autenticando,
    perfil,

    // navegacao
    aba,
    setAba,
    periodo,
    setPeriodo,

    // dados
    habitos,
    listaAtual,
    estadoLista,
    itensVisiveis,
    grupos,
    tagPorId,
    estatisticas,
    streak,

    // derivados
    pct,
    feitos,
    indice,

    // habitos
    alternarHabito,
    rascunho,
    abrirNovoHabito,
    abrirEdicaoHabito,
    fecharRascunho,
    mudarRascunho,
    alternarDiaDoRascunho,
    salvarRascunho,
    excluirDoRascunho,

    // listas
    definirEscopo,
    definirFiltro,
    rascunhoItem,
    abrirNovoItem,
    fecharRascunhoItem,
    mudarRascunhoItem,
    salvarItem,
    alternarItem,
    excluirItem,
    criarTag,
    excluirTag,

    // estado geral
    comemorando,
    carregando,
    erro,
    limparErro: useCallback(() => setErro(null), []),
    recarregar,
    recarregarEstatisticas,
  };
}

export type PlannerStore = ReturnType<typeof usePlanner>;

function mensagemDeErro(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as Error).message);
  return 'Algo deu errado. Tente de novo em instantes.';
}
