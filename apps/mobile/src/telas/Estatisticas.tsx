/** Aba "Suas conquistas": números, gráfico do período, consistência e medalhas. */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GRADIENTES,
  corDaBarra,
  deIso,
  gapDasBarras,
  hoje,
  montarConquistas,
  tituloDoGrafico,
  MESES,
  type PlannerStore,
  type Periodo,
} from '@planner-fofo/shared';
import { CORES, F, paleta, sombra } from '../tema';
import { Gradiente, Segmentado } from '../componentes/Base';
import Rodinha from '../componentes/Rodinha';

const PERIODOS: readonly Periodo[] = ['Semana', 'Mês', 'Ano'] as const;
const ALTURA_GRAFICO = 150;

export function Estatisticas({ planner }: { planner: PlannerStore }) {
  const { estatisticas, periodo, habitos } = planner;

  const conquistas = useMemo(() => {
    if (!estatisticas) return [];
    return montarConquistas({
      streak: estatisticas.streak,
      totalConclusoes: estatisticas.contadores.totalConclusoes,
      diasComRegistro: estatisticas.contadores.diasComRegistro,
      diasCompletos: estatisticas.contadores.diasCompletos,
      mediaMes: estatisticas.mediaMes,
      mediaAno: estatisticas.mediaAno,
    });
  }, [estatisticas]);

  if (!estatisticas) {
    return (
      <View style={estilos.carregando}>
        <Rodinha cor="#c98af0" />
        <Text style={estilos.carregandoTexto}>Somando suas conquistas…</Text>
      </View>
    );
  }

  const gap = gapDasBarras(periodo);
  const mesAtual = MESES[deIso(hoje()).getMonth()];

  return (
    <View style={estilos.raiz}>
      <View style={estilos.numeros}>
        <Gradiente cores={GRADIENTES.streak} style={[estilos.numeroCartao, estilos.bordaStreak]}>
          <Text style={estilos.numeroEmoji}>🔥</Text>
          <Text style={[estilos.numeroValor, { color: CORES.rosaForte }]}>
            {estatisticas.streak}
          </Text>
          <Text style={[estilos.numeroRotulo, { color: CORES.rosaSuave }]}>dias seguidos</Text>
        </Gradiente>

        <Gradiente cores={GRADIENTES.media} style={[estilos.numeroCartao, estilos.bordaMedia]}>
          <Text style={estilos.numeroEmoji}>💜</Text>
          <Text style={[estilos.numeroValor, { color: CORES.roxoForte }]}>
            {estatisticas.media}%
          </Text>
          <Text style={[estilos.numeroRotulo, { color: CORES.roxoMedio }]}>
            média {periodo.toLowerCase()}
          </Text>
        </Gradiente>
      </View>

      <Segmentado
        opcoes={PERIODOS}
        valor={periodo}
        aoTrocar={(p) => planner.setPeriodo(p)}
      />

      <View style={[estilos.cartao, sombra('suave')]}>
        <Text style={estilos.cartaoTitulo}>{tituloDoGrafico(periodo, mesAtual)}</Text>

        <View style={[estilos.grafico, { gap }]}>
          {estatisticas.barras.map((barra, i) => {
            const { cores } = corDaBarra(barra.valor);
            const altura = Math.max(4, barra.valor) / 100;
            return (
              <View key={`${barra.rotulo}-${i}`} style={estilos.colunaBarra}>
                <Text style={estilos.valorBarra}>{barra.valor > 0 ? `${barra.valor}%` : ''}</Text>
                <Gradiente
                  cores={cores}
                  style={[estilos.barra, { height: `${altura * 100}%` }]}
                />
                <Text style={estilos.rotuloBarra}>{barra.rotulo}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>
          Consistência por hábito · {periodo.toLowerCase()}
        </Text>

        {estatisticas.consistencia.map((linha) => {
          const habito = habitos.find((h) => h.id === linha.habitoId);
          if (!habito) return null;
          const p = paleta(habito.cor);
          return (
            <View key={linha.habitoId} style={estilos.consistencia}>
              <View style={estilos.consistenciaLinha}>
                <Text style={estilos.consistenciaEmoji}>{habito.emoji}</Text>
                <Text style={estilos.consistenciaNome} numberOfLines={1}>
                  {habito.nome} · {Math.min(linha.feitos, linha.meta)}/{linha.meta} dias
                </Text>
                <Text style={[estilos.consistenciaPct, { color: p.texto }]}>{linha.pct}%</Text>
              </View>
              <View style={estilos.consistenciaTrilha}>
                <View
                  style={[
                    estilos.consistenciaPreenchimento,
                    { width: `${linha.pct}%`, backgroundColor: p.forte },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <Gradiente cores={GRADIENTES.conquistas} style={[estilos.cartao, estilos.bordaConquistas]}>
        <Text style={estilos.cartaoTitulo}>Conquistas fofas</Text>
        <View style={estilos.medalhas}>
          {conquistas.map((c, i) => (
            <View
              key={`${c.nome}-${i}`}
              style={[
                estilos.medalha,
                {
                  opacity: c.conquistada ? 1 : 0.45,
                  backgroundColor: c.conquistada ? '#ffffff' : '#faf5fb',
                  borderColor: c.conquistada ? '#f7d9ee' : '#efe5f0',
                },
              ]}
            >
              <Text style={estilos.medalhaEmoji}>{c.emoji}</Text>
              <Text style={estilos.medalhaNome} numberOfLines={2}>
                {c.nome}
              </Text>
              <Text style={estilos.medalhaDica}>{c.dica}</Text>
            </View>
          ))}
        </View>
      </Gradiente>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 17 },
  carregando: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  carregandoTexto: { fontFamily: F.baloo, fontSize: 14, color: CORES.subtitulo },

  numeros: { flexDirection: 'row', gap: 11 },
  numeroCartao: { flex: 1, borderRadius: 26, padding: 15, gap: 3, borderWidth: 1.5 },
  bordaStreak: { borderColor: '#fcc9e4' },
  bordaMedia: { borderColor: '#ddd0fb' },
  numeroEmoji: { fontSize: 20 },
  numeroValor: { fontFamily: F.balooExtra, fontSize: 27 },
  numeroRotulo: { fontFamily: F.nunitoExtra, fontSize: 11, letterSpacing: 0.3 },

  cartao: {
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: CORES.cartao,
    borderWidth: 1.5,
    borderColor: CORES.bordaCartao,
    gap: 15,
  },
  bordaConquistas: { borderColor: '#f0dcf6' },
  cartaoTitulo: { fontFamily: F.baloo, fontSize: 15.5, color: CORES.titulo },

  grafico: { flexDirection: 'row', alignItems: 'flex-end', height: ALTURA_GRAFICO },
  colunaBarra: { flex: 1, alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' },
  valorBarra: { fontFamily: F.nunitoExtra, fontSize: 9.5, color: CORES.apoio },
  barra: { width: '100%', borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  rotuloBarra: { fontFamily: F.nunitoExtra, fontSize: 9.5, color: '#b295c0' },

  consistencia: { gap: 7 },
  consistenciaLinha: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  consistenciaEmoji: { fontSize: 14 },
  consistenciaNome: { flex: 1, fontFamily: F.nunito, fontSize: 12.5, color: '#7b5589' },
  consistenciaPct: { fontFamily: F.baloo, fontSize: 13.5 },
  consistenciaTrilha: { height: 9, borderRadius: 999, backgroundColor: CORES.trilha },
  consistenciaPreenchimento: { height: '100%', borderRadius: 999 },

  medalhas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  medalha: {
    // 3 colunas: (100% - 2 gaps de 10) / 3
    width: '31%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  medalhaEmoji: { fontSize: 20 },
  medalhaNome: {
    fontFamily: F.nunitoExtra,
    fontSize: 9.5,
    textAlign: 'center',
    color: CORES.grupo,
    lineHeight: 12,
  },
  medalhaDica: { fontFamily: F.nunitoExtra, fontSize: 8.5, textAlign: 'center', color: CORES.apoio },
});
