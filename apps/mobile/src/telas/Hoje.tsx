/** Aba "Seu dia": cartão de progresso + hábitos fixos. */
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GRADIENTES,
  mensagemDoDia,
  ordenarParaHoje,
  resumoDeHoje,
  type PlannerStore,
} from '@planner-fofo/shared';
import { CORES, F, sombra } from '../tema';
import { Gradiente } from '../componentes/Base';
import { Anel } from '../componentes/Anel';
import { CartaoHabito } from '../componentes/CartaoHabito';

export function Hoje({ planner }: { planner: PlannerStore }) {
  const { habitos, pct, indice, perfil } = planner;

  // Os hábitos de hoje ficam no topo; os de outros dias seguem abaixo.
  const emOrdem = useMemo(() => ordenarParaHoje(habitos, indice), [habitos, indice]);

  return (
    <View style={estilos.raiz}>
      <Gradiente cores={GRADIENTES.heroi} style={[estilos.heroi, sombra('media')]}>
        {/* Bolha decorativa do canto superior direito. */}
        <View style={estilos.bolha} />

        <View style={estilos.heroiLinha}>
          <Anel
            pct={pct}
            acento={perfil?.acento ?? '#c98af0'}
            circular={perfil?.progressoCircular ?? true}
          />

          <View style={estilos.heroiTextos}>
            <Text style={estilos.mensagem}>{mensagemDoDia(pct)}</Text>
            <Text style={estilos.resumo}>{resumoDeHoje(habitos, indice)}</Text>

            <View style={estilos.trilha}>
              <Gradiente
                cores={GRADIENTES.primario}
                style={[estilos.preenchimento, { width: `${pct}%` }]}
              />
            </View>
          </View>
        </View>
      </Gradiente>

      <View style={estilos.tituloLinha}>
        <Text style={estilos.titulo}>Meus hábitos fixos</Text>
        <Pressable onPress={planner.abrirNovoHabito} style={estilos.botaoNovo}>
          <Text style={estilos.botaoNovoIcone}>+</Text>
          <Text style={estilos.botaoNovoTexto}>Novo</Text>
        </Pressable>
      </View>

      <View style={estilos.lista}>
        {emOrdem.map((habito) => (
          <CartaoHabito
            key={habito.id}
            habito={habito}
            indiceHoje={indice}
            aoAlternar={() => void planner.alternarHabito(habito.id)}
            aoEditar={() => planner.abrirEdicaoHabito(habito.id)}
          />
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 18 },

  heroi: { borderRadius: 32, padding: 22, overflow: 'hidden' },
  bolha: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.35)',
    top: -50,
    right: -30,
  },
  heroiLinha: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroiTextos: { flex: 1, gap: 9, minWidth: 0 },
  mensagem: { fontFamily: F.baloo, fontSize: 19, color: CORES.tituloSuave, lineHeight: 22 },
  resumo: { fontFamily: F.nunito, fontSize: 12.5, color: CORES.apoioForte },
  trilha: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    padding: 3,
    justifyContent: 'center',
  },
  preenchimento: { height: '100%', borderRadius: 999 },

  tituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  titulo: { fontFamily: F.baloo, fontSize: 18, color: CORES.titulo },
  botaoNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#f7d9ee',
    backgroundColor: '#fff0f8',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  botaoNovoIcone: { fontSize: 14, color: CORES.abaAtiva, fontFamily: F.baloo },
  botaoNovoTexto: { fontSize: 12.5, color: CORES.abaAtiva, fontFamily: F.baloo },

  lista: { gap: 13 },
});
