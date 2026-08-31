/** Abas "Estudos" e "Sem pressão": listas leves que não entram na porcentagem. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  hoje,
  rodapeDaLista,
  textosDaLista,
  type Item,
  type PlannerStore,
  type Tag,
} from '@planner-fofo/shared';
import { CORES, F, paleta, sombra } from '../tema';
import { Chip, Segmentado, Vazio } from '../componentes/Base';

const ESCOPOS = ['Hoje', 'Histórico'] as const;

export function Lista({ planner }: { planner: PlannerStore }) {
  const { estadoLista, itensVisiveis, grupos, tagPorId, listaAtual } = planner;
  const ehEstudos = listaAtual === 'estudos';
  const textos = textosDaLista(ehEstudos);

  const tagFiltro = estadoLista.filtroTagId ? tagPorId.get(estadoLista.filtroTagId) : undefined;
  const mostrarChips = estadoLista.escopo === 'tudo';
  const mostrarPainel = Boolean(tagFiltro) && mostrarChips;

  return (
    <View style={estilos.raiz}>
      <View
        style={[
          estilos.aviso,
          {
            backgroundColor: ehEstudos ? '#f7f0ff' : '#f1ecfe',
            borderColor: ehEstudos ? '#e6d7fb' : '#e2d6fb',
          },
        ]}
      >
        <Text style={estilos.avisoEmoji}>{textos.avisoEmoji}</Text>
        <Text style={[estilos.avisoTexto, { color: ehEstudos ? '#7d4fbf' : '#7d63b8' }]}>
          {textos.aviso}
        </Text>
      </View>

      <Segmentado
        opcoes={ESCOPOS}
        valor={estadoLista.escopo === 'hoje' ? 'Hoje' : 'Histórico'}
        aoTrocar={(v) => planner.definirEscopo(v === 'Hoje' ? 'hoje' : 'tudo')}
      />

      {mostrarChips ? (
        <View style={estilos.chips}>
          <Chip
            rotulo="Todas"
            aoTocar={() => planner.definirFiltro(null)}
            fundo={tagFiltro ? CORES.cartaoAlt : CORES.chipAtivo}
            borda={tagFiltro ? CORES.bordaClara : CORES.chipBorda}
            cor={tagFiltro ? '#bfa3ca' : CORES.abaAtiva}
          />
          {estadoLista.tags.map((tag) => {
            const p = paleta(tag.cor);
            const ativo = estadoLista.filtroTagId === tag.id;
            return (
              <Chip
                key={tag.id}
                rotulo={tag.nome}
                ponto={p.forte}
                aoTocar={() => planner.definirFiltro(ativo ? null : tag.id)}
                fundo={ativo ? p.bg : CORES.cartaoAlt}
                borda={ativo ? p.borda : CORES.bordaClara}
                cor={ativo ? p.texto : '#bfa3ca'}
              />
            );
          })}
        </View>
      ) : null}

      {mostrarPainel && tagFiltro ? (
        <PainelDaTag tag={tagFiltro} itens={estadoLista.itens} ehEstudos={ehEstudos} />
      ) : null}

      <View style={estilos.grupos}>
        {grupos.map((grupo) => (
          <View key={grupo.data} style={estilos.grupo}>
            <View style={estilos.grupoCabecalho}>
              <Text style={estilos.grupoRotulo}>{grupo.rotulo}</Text>
              <View style={estilos.grupoLinha} />
              <Text style={estilos.grupoContagem}>{grupo.contagem}</Text>
            </View>

            {grupo.itens.map((item) => (
              <LinhaItem
                key={item.id}
                item={item}
                tag={item.tagId ? tagPorId.get(item.tagId) : undefined}
                mostrarData={grupo.data !== hoje()}
                rotuloData={grupo.rotulo}
                aoAlternar={() => void planner.alternarItem(item.id)}
                aoEditar={() => planner.abrirEdicaoItem(item.id)}
                aoRemover={() => void planner.excluirItem(item.id)}
              />
            ))}
          </View>
        ))}
      </View>

      {itensVisiveis.length === 0 ? (
        <Vazio texto={estadoLista.escopo === 'hoje' ? textos.vazioHoje : textos.vazioFiltro} />
      ) : (
        // O gesto não tem ícone que o anuncie, então a dica faz esse papel.
        <Text style={estilos.dica}>segure um item pra editar ✏️</Text>
      )}

      <Text style={estilos.rodape}>
        {rodapeDaLista(itensVisiveis, estadoLista.escopo, ehEstudos)}
      </Text>
    </View>
  );
}

/** Resumo de conclusão da matéria/categoria filtrada. */
function PainelDaTag({
  tag,
  itens,
  ehEstudos,
}: {
  tag: Tag;
  itens: Item[];
  ehEstudos: boolean;
}) {
  const p = paleta(tag.cor);
  const daTag = itens.filter((i) => i.tagId === tag.id);
  const feitos = daTag.filter((i) => i.feito).length;
  const pct = daTag.length ? Math.round((feitos / daTag.length) * 100) : 0;

  return (
    <View style={[estilos.painel, { backgroundColor: p.bg, borderColor: p.borda }]}>
      <View style={estilos.painelPct}>
        <Text style={[estilos.painelPctTexto, { color: p.texto }]}>{pct}%</Text>
      </View>
      <View style={estilos.painelTextos}>
        <Text style={[estilos.painelTitulo, { color: p.texto }]}>{tag.nome}</Text>
        <Text style={[estilos.painelResumo, { color: p.texto }]}>
          {daTag.length} {ehEstudos ? 'conteúdos' : 'tarefas'} · {feitos} concluídos
        </Text>
      </View>
    </View>
  );
}

/**
 * Uma linha da lista. Editar é segurar a linha: o item já tem caixa e ✕, e um
 * terceiro botão deixaria a linha apertada demais no celular.
 */
function LinhaItem({
  item,
  tag,
  mostrarData,
  rotuloData,
  aoAlternar,
  aoEditar,
  aoRemover,
}: {
  item: Item;
  tag?: Tag;
  mostrarData: boolean;
  rotuloData: string;
  aoAlternar: () => void;
  aoEditar: () => void;
  aoRemover: () => void;
}) {
  const p = paleta(tag?.cor);
  const rodape = `${tag?.nome ?? 'Sem tag'}${mostrarData ? ` · ${rotuloData}` : ''}`;

  return (
    <Pressable
      onLongPress={aoEditar}
      accessibilityLabel={`Editar ${item.texto}`}
      accessibilityHint="Segure para editar"
      style={({ pressed }) => [
        estilos.item,
        {
          backgroundColor: item.feito ? CORES.feitoBg : p.bg,
          borderColor: item.feito ? CORES.feitoBorda : p.borda,
        },
        sombra('suave'),
        pressed && estilos.itemPressionado,
      ]}
    >
      <Pressable
        onPress={aoAlternar}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.feito }}
        style={[
          estilos.caixa,
          { borderColor: p.borda, backgroundColor: item.feito ? p.forte : '#ffffff' },
        ]}
      >
        {item.feito ? <Text style={estilos.caixaIcone}>✓</Text> : null}
      </Pressable>

      <View style={estilos.itemTextos}>
        <Text
          style={[
            estilos.itemTexto,
            {
              color: item.feito ? CORES.feitoTexto : CORES.titulo,
              textDecorationLine: item.feito ? 'line-through' : 'none',
            },
          ]}
        >
          {item.texto}
        </Text>
        <Text style={[estilos.itemRodape, { color: p.texto }]}>{rodape.toUpperCase()}</Text>
      </View>

      <Pressable onPress={aoRemover} hitSlop={8} accessibilityLabel="Remover item">
        <Text style={estilos.remover}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 15 },

  aviso: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
  avisoEmoji: { fontSize: 17 },
  avisoTexto: { flex: 1, fontFamily: F.nunito, fontSize: 12.5, lineHeight: 18 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  painel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 17,
  },
  painelPct: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  painelPctTexto: { fontFamily: F.balooExtra, fontSize: 17 },
  painelTextos: { flex: 1, gap: 2, minWidth: 0 },
  painelTitulo: { fontFamily: F.baloo, fontSize: 16.5 },
  painelResumo: { fontFamily: F.nunito, fontSize: 11.5, opacity: 0.75 },

  grupos: { gap: 16 },
  grupo: { gap: 10 },
  grupoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 4 },
  grupoRotulo: { fontFamily: F.baloo, fontSize: 14, color: CORES.grupo },
  grupoLinha: { flex: 1, height: 1.5, backgroundColor: CORES.divisor, borderRadius: 2 },
  grupoContagem: { fontFamily: F.nunitoExtra, fontSize: 10.5, color: CORES.grupoContagem },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  caixa: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaIcone: { color: '#fff', fontSize: 13, fontFamily: F.baloo },
  itemTextos: { flex: 1, gap: 2, minWidth: 0 },
  itemTexto: { fontFamily: F.nunito, fontSize: 13.5, lineHeight: 17.5 },
  itemRodape: { fontFamily: F.nunitoExtra, fontSize: 10, letterSpacing: 0.5 },
  itemPressionado: { opacity: 0.7 },
  remover: { color: CORES.remover, fontSize: 15, padding: 4 },

  dica: {
    textAlign: 'center',
    fontFamily: F.nunito,
    fontSize: 11,
    color: CORES.apoio,
  },

  rodape: {
    textAlign: 'center',
    fontFamily: F.nunito,
    fontSize: 11.5,
    color: CORES.apoio,
    paddingVertical: 2,
  },
});
