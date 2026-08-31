/**
 * Anel de progresso.
 *
 * O design usa `conic-gradient(acento Xdeg, #f6e6fa Xdeg)`, que nao existe no
 * React Native. O mesmo resultado sai de um circulo SVG com `strokeDasharray`:
 * o arco preenchido cobre exatamente a mesma fracao da volta.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CORES, F } from '../tema';

const TRILHA = '#f6e6fa';

export function Anel({
  pct,
  acento,
  circular = true,
  tamanho = 108,
  espessura = 13,
}: {
  pct: number;
  acento: string;
  /** `false` desenha o anel liso (prop `progressoCircular` do design). */
  circular?: boolean;
  tamanho?: number;
  espessura?: number;
}) {
  const raio = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * raio;
  const preenchido = (Math.min(100, Math.max(0, pct)) / 100) * volta;
  const interno = tamanho - espessura * 2;

  return (
    <View style={[estilos.caixa, { width: tamanho, height: tamanho }]}>
      <Svg width={tamanho} height={tamanho}>
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          stroke={TRILHA}
          strokeWidth={espessura}
          fill="none"
        />
        {circular ? (
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={acento}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={`${preenchido} ${volta}`}
            // Comeca no topo, como o conic-gradient do design.
            transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
            fill="none"
          />
        ) : (
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke="#e8d9fd"
            strokeWidth={espessura}
            fill="none"
          />
        )}
      </Svg>

      <View
        style={[
          estilos.miolo,
          { width: interno, height: interno, borderRadius: interno / 2 },
        ]}
      >
        <Text style={[estilos.numero, { fontSize: tamanho * 0.28 }]}>{pct}%</Text>
        <Text style={estilos.legenda}>DO DIA</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { alignItems: 'center', justifyContent: 'center' },
  miolo: {
    position: 'absolute',
    backgroundColor: CORES.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: { fontFamily: F.balooExtra, color: CORES.tituloForte, lineHeight: undefined },
  legenda: { fontFamily: F.nunitoExtra, fontSize: 10, color: '#bd8fcb', letterSpacing: 0.8 },
});
