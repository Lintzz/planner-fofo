/**
 * Planner Fofo — app mobile.
 *
 * A moldura segue o artboard "Planner Fofo.dc.html": cabeçalho com saudação e
 * sequência, conteúdo rolável, botão flutuante nas listas e a barra de abas
 * arredondada presa no rodapé.
 */
import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Rodinha from './src/componentes/Rodinha';
import { useFonts } from 'expo-font';
import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  GRADIENTES,
  ambienteConfigurado,
  saudacao,
  textosDaLista,
  tituloDaAba,
  usePlanner,
  type Aba,
} from '@planner-fofo/shared';

import { obterSupabase } from './src/lib/supabase';
import { CORES, F, sombra } from './src/tema';
import { BotaoPrimario } from './src/componentes/Base';
import { Confete } from './src/componentes/Confete';
import { FolhaHabito } from './src/componentes/FolhaHabito';
import { ModalItem } from './src/componentes/ModalItem';
import { Hoje } from './src/telas/Hoje';
import { Lista } from './src/telas/Lista';
import { Estatisticas } from './src/telas/Estatisticas';
import { Login } from './src/telas/Login';

const ABAS: { k: Aba; nome: string; emoji: string }[] = [
  { k: 'hoje', nome: 'Hoje', emoji: '🌸' },
  { k: 'estudos', nome: 'Estudos', emoji: '📖' },
  { k: 'tarefas', nome: 'Avulsas', emoji: '🫧' },
  { k: 'stats', nome: 'Gráficos', emoji: '📈' },
];

export default function App() {
  const [fontesProntas] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Sem URL/chave o cliente nem chega a ser criado — melhor dizer isso
  // claramente do que deixar o app numa tela branca.
  if (!ambienteConfigurado()) return <SemAmbiente />;
  if (!fontesProntas) return <Carregando />;

  return (
    <SafeAreaProvider>
      <Conteudo />
    </SafeAreaProvider>
  );
}

function Conteudo() {
  // `obterSupabase` é singleton, mas o useMemo deixa explícito que a
  // referência tem de ser estável — `usePlanner` usa o cliente como dependência.
  const supabase = useMemo(() => obterSupabase(), []);
  const planner = usePlanner(supabase);
  const { aba, sessao, autenticando, carregando, erro } = planner;

  // O app desenha de ponta a ponta (`edgeToEdgeEnabled`), então o recuo das
  // barras do sistema é aplicado à mão. `SafeAreaView` do react-native não
  // serve: no Android ela é uma View comum.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (erro) console.warn('[Planner Fofo]', erro);
  }, [erro]);

  const ehLista = aba === 'estudos' || aba === 'tarefas';

  return (
    <LinearGradient
      colors={[...GRADIENTES.fundo]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={estilos.fundo}
    >
      <StatusBar style="dark" />
      <View style={estilos.seguro}>
        {autenticando ? (
          <Carregando />
        ) : !sessao ? (
          <Login />
        ) : (
          <>
            <View style={[estilos.cabecalho, { paddingTop: insets.top + 10 }]}>
              <View style={estilos.cabecalhoTextos}>
                <Text style={estilos.saudacao}>{saudacao(planner.perfil?.nome ?? 'Manu')}</Text>
                <Text style={estilos.tituloAba}>{tituloDaAba(aba)}</Text>
              </View>

              <View style={[estilos.streak, sombra('suave')]}>
                <Text style={estilos.streakEmoji}>🔥</Text>
                <Text style={estilos.streakNumero}>{planner.streak}</Text>
                <Text style={estilos.streakRotulo}>DIAS</Text>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={[
                estilos.conteudo,
                { paddingBottom: 130 + insets.bottom },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {carregando ? (
                <Carregando />
              ) : aba === 'hoje' ? (
                <Hoje planner={planner} />
              ) : ehLista ? (
                <Lista planner={planner} />
              ) : (
                <Estatisticas planner={planner} />
              )}
            </ScrollView>

            <LinearGradient
              colors={[...GRADIENTES.fundoRodape]}
              locations={[0, 0.38, 1]}
              style={[estilos.rodape, { paddingBottom: 20 + insets.bottom }]}
              pointerEvents="box-none"
            >
              {ehLista ? (
                <BotaoPrimario
                  icone="+"
                  rotulo={textosDaLista(aba === 'estudos').rotuloBotao}
                  aoTocar={planner.abrirNovoItem}
                  style={estilos.fab}
                />
              ) : null}

              <View style={[estilos.abas, sombra('media')]}>
                {ABAS.map((item) => {
                  const ativo = aba === item.k;
                  return (
                    <Pressable
                      key={item.k}
                      onPress={() => planner.setAba(item.k)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: ativo }}
                      style={[estilos.tab, ativo && estilos.tabAtiva]}
                    >
                      <Text style={estilos.tabEmoji}>{item.emoji}</Text>
                      <Text
                        style={[estilos.tabTexto, { color: ativo ? CORES.abaAtiva : CORES.aba }]}
                      >
                        {item.nome}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </LinearGradient>

            <FolhaHabito planner={planner} />
            <ModalItem planner={planner} />
            <Confete visivel={planner.comemorando} />
          </>
        )}
      </View>
    </LinearGradient>
  );
}

function Carregando() {
  return (
    <View style={estilos.centro}>
      <Rodinha cor="#c98af0" />
    </View>
  );
}

function SemAmbiente() {
  return (
    <View style={[estilos.centro, estilos.semAmbiente]}>
      <Text style={estilos.semAmbienteEmoji}>🌸</Text>
      <Text style={estilos.semAmbienteTitulo}>Falta configurar o Supabase</Text>
      <Text style={estilos.semAmbienteTexto}>
        Copie <Text style={estilos.mono}>.env.example</Text> para{' '}
        <Text style={estilos.mono}>.env</Text> na raiz do monorepo e preencha{' '}
        <Text style={estilos.mono}>EXPO_PUBLIC_SUPABASE_URL</Text> e{' '}
        <Text style={estilos.mono}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>. Depois reinicie o Expo com{' '}
        <Text style={estilos.mono}>--clear</Text>.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1 },
  seguro: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },

  cabecalho: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cabecalhoTextos: { gap: 1, flex: 1 },
  saudacao: { fontFamily: F.nunito, fontSize: 12.5, color: CORES.subtitulo, letterSpacing: 0.4 },
  tituloAba: { fontFamily: F.baloo, fontSize: 25, color: CORES.titulo },

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fdeef8',
    borderWidth: 1.5,
    borderColor: '#f7d9ee',
    borderRadius: 999,
    paddingVertical: 7,
    paddingLeft: 9,
    paddingRight: 13,
  },
  streakEmoji: { fontSize: 15 },
  streakNumero: { fontFamily: F.baloo, fontSize: 16, color: '#d6549a' },
  streakRotulo: { fontFamily: F.nunitoExtra, fontSize: 10.5, color: '#c07fb3', letterSpacing: 0.6 },

  conteudo: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 130 },

  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
    alignItems: 'flex-end',
  },
  fab: { alignSelf: 'flex-end' },
  abas: {
    width: '100%',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f6e0f0',
    borderRadius: 999,
    padding: 6,
  },
  tab: { flex: 1, borderRadius: 999, paddingTop: 10, paddingBottom: 9, alignItems: 'center', gap: 2 },
  tabAtiva: { backgroundColor: CORES.chipAtivo },
  tabEmoji: { fontSize: 16 },
  tabTexto: { fontFamily: F.baloo, fontSize: 10.5 },

  semAmbiente: { padding: 32, backgroundColor: CORES.fundoApp },
  semAmbienteEmoji: { fontSize: 34 },
  semAmbienteTitulo: { fontSize: 19, fontWeight: '700', color: CORES.titulo, textAlign: 'center' },
  semAmbienteTexto: { fontSize: 13.5, color: CORES.apoioForte, textAlign: 'center', lineHeight: 20 },
  mono: { fontWeight: '700', color: CORES.abaAtiva },
});
