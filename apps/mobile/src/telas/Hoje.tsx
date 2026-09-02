/** Aba "Seu dia": cartão de progresso + hábitos fixos. */
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GRADIENTES,
  hoje,
  mensagemDoDia,
  ordenarParaHoje,
  resumoDeHoje,
  rotuloData,
  somarDias,
  type PlannerStore,
} from '@planner-fofo/shared';
import { CORES, F, sombra } from '../tema';
import { Gradiente } from '../componentes/Base';
import { Anel } from '../componentes/Anel';
import { CartaoHabito } from '../componentes/CartaoHabito';

export function Hoje({ planner }: { planner: PlannerStore }) {
  const { habitos, pct, indice, indiceMaximo, perfil, dataSelecionada, ehHoje } = planner;
  const rotulo = rotuloData(dataSelecionada);

  // Os hábitos de hoje ficam no topo; os de outros dias seguem abaixo.
  const emOrdem = useMemo(() => ordenarParaHoje(habitos, indice), [habitos, indice]);

  return (
    <View style={estilos.raiz}>
      {/* Seletor de dia: é por ele que se volta para ontem e se marca o hábito
          que ficou esquecido. Não passa de hoje. */}
      <View style={estilos.seletorData}>
        <Pressable
          hitSlop={10}
          onPress={() => planner.irParaDia(somarDias(dataSelecionada, -1))}
          accessibilityLabel="Dia anterior"
          style={estilos.seta}
        >
          <Text style={estilos.setaTexto}>‹</Text>
        </Pressable>

        <Pressable
          hitSlop={8}
          onPress={() => planner.irParaDia(hoje())}
          disabled={ehHoje}
          accessibilityLabel="Voltar para hoje"
          style={estilos.dataCentro}
        >
          <Text style={estilos.dataEscolhida}>{rotulo}</Text>
          {!ehHoje ? <Text style={estilos.voltarHoje}>toque pra voltar pra hoje</Text> : null}
        </Pressable>

        <Pressable
          hitSlop={10}
          onPress={() => planner.irParaDia(somarDias(dataSelecionada, 1))}
          disabled={ehHoje}
          accessibilityLabel="Próximo dia"
          style={estilos.seta}
        >
          <Text style={[estilos.setaTexto, ehHoje && estilos.setaDesligada]}>›</Text>
        </Pressable>
      </View>

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
            <Text style={estilos.resumo}>
              {resumoDeHoje(habitos, indice, rotulo.toLowerCase())}
            </Text>

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
            indiceSelecionado={indice}
            indiceMaximo={indiceMaximo}
            aoAlternar={() => void planner.alternarHabito(habito.id)}
            aoAlternarDia={(dia) => void planner.alternarHabitoNoDia(habito.id, dia)}
            aoEditar={() => planner.abrirEdicaoHabito(habito.id)}
          />
        ))}
      </View>

      {/* O gesto não tem ícone que o anuncie, então a dica faz esse papel. */}
      {emOrdem.length ? (
        <Text style={estilos.dica}>
          segure um hábito pra editar ✏️ · toque numa barrinha pra marcar outro dia
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 18 },

  seletorData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: CORES.campoBorda,
    backgroundColor: CORES.campoFundo,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  seta: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  setaTexto: { fontFamily: F.baloo, fontSize: 22, color: CORES.fechar },
  setaDesligada: { opacity: 0.35 },
  dataCentro: { flex: 1, alignItems: 'center', gap: 1 },
  dataEscolhida: { fontFamily: F.baloo, fontSize: 15, color: CORES.titulo },
  voltarHoje: { fontFamily: F.nunito, fontSize: 10.5, color: CORES.apoio },

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
  dica: { textAlign: 'center', fontFamily: F.nunito, fontSize: 11, color: CORES.apoio },
});
