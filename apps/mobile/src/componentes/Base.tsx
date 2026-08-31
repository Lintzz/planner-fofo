/** Peças reutilizadas nas três abas: pílulas, chips, botões e vazios. */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CORES, F, GRADIENTES, sombra } from '../tema';

/** Gradiente na diagonal, equivalente a `linear-gradient(140deg, …)` do design. */
export function Gradiente({
  cores,
  style,
  children,
}: {
  cores: readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={cores as [string, string, ...string[]]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

/** Controle segmentado: "Hoje / Histórico" e "Semana / Mês / Ano". */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoTrocar,
}: {
  opcoes: readonly T[];
  valor: T;
  aoTrocar: (v: T) => void;
}) {
  return (
    <View style={estilos.segmentado}>
      {opcoes.map((opcao) => {
        const ativo = opcao === valor;
        return (
          <Pressable
            key={opcao}
            onPress={() => aoTrocar(opcao)}
            style={[estilos.segmento, ativo && estilos.segmentoAtivo, ativo && sombra('suave')]}
          >
            <Text style={[estilos.segmentoTexto, { color: ativo ? CORES.abaAtiva : CORES.apoio }]}>
              {opcao}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Chip de filtro por tag, com o pontinho colorido da paleta. */
export function Chip({
  rotulo,
  ativo,
  ponto,
  fundo,
  borda,
  cor,
  aoTocar,
  children,
}: {
  rotulo: string;
  ativo?: boolean;
  ponto?: string;
  fundo: string;
  borda: string;
  cor: string;
  aoTocar: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      style={[estilos.chip, { backgroundColor: fundo, borderColor: borda }]}
    >
      {ponto ? <View style={[estilos.ponto, { backgroundColor: ponto }]} /> : null}
      <Text style={[estilos.chipTexto, { color: cor }]}>{rotulo}</Text>
      {children}
    </Pressable>
  );
}

/** Botão principal rosa→lilás. */
export function BotaoPrimario({
  rotulo,
  aoTocar,
  icone,
  style,
}: {
  rotulo: string;
  aoTocar: () => void;
  icone?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={aoTocar} style={({ pressed }) => [pressed && estilos.pressionado, style]}>
      <Gradiente cores={GRADIENTES.primario} style={[estilos.botao, sombra('media', '#b450b4')]}>
        {icone ? <Text style={estilos.botaoIcone}>{icone}</Text> : null}
        <Text style={estilos.botaoTexto}>{rotulo}</Text>
      </Gradiente>
    </Pressable>
  );
}

/** Estado vazio com a borda tracejada do design. */
export function Vazio({ texto }: { texto: string }) {
  return (
    <View style={estilos.vazio}>
      <Text style={estilos.vazioEmoji}>🌼</Text>
      <Text style={estilos.vazioTexto}>{texto}</Text>
    </View>
  );
}

/** Rótulo em caixa alta acima dos campos dos formulários. */
export function RotuloCampo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.rotuloCampo}>{children}</Text>;
}

const estilos = StyleSheet.create({
  segmentado: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: CORES.pilula,
    borderRadius: 999,
    padding: 5,
  },
  segmento: { flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  segmentoAtivo: { backgroundColor: CORES.pilulaAtiva },
  segmentoTexto: { fontFamily: F.baloo, fontSize: 13 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipTexto: { fontFamily: F.nunitoExtra, fontSize: 11.5 },
  ponto: { width: 8, height: 8, borderRadius: 4 },

  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  botaoIcone: { fontSize: 19, color: '#fff', fontFamily: F.baloo },
  botaoTexto: { fontSize: 15, color: '#fff', fontFamily: F.baloo },
  pressionado: { transform: [{ scale: 0.96 }] },

  vazio: {
    borderRadius: 26,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: CORES.cartaoAlt,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: CORES.vazioBorda,
    alignItems: 'center',
    gap: 8,
  },
  vazioEmoji: { fontSize: 26 },
  vazioTexto: { fontFamily: F.baloo, fontSize: 15, color: CORES.subtitulo, textAlign: 'center' },

  rotuloCampo: {
    fontFamily: F.nunitoExtra,
    fontSize: 11,
    letterSpacing: 0.6,
    color: CORES.rotulo,
    textTransform: 'uppercase',
  },
});
