/** Cartão de hábito fixo da aba Hoje, com as barrinhas da semana. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DIAS, DIAS_LONGOS, contadorDaSemana, type HabitoDaSemana } from '@planner-fofo/shared';
import { CORES, F, paleta, sombra } from '../tema';

/**
 * Tocar numa barrinha da semana marca aquele dia — é o conserto de um hábito
 * que a gente esqueceu de marcar na hora.
 *
 * Editar é segurar o cartão — o mesmo gesto das listas de Estudos e Avulsas.
 * O lápis saiu: no celular ele ficava colado no check de marcar, e o toque
 * errado abria a folha de edição em vez de concluir o hábito.
 */
export function CartaoHabito({
  habito,
  indiceSelecionado,
  indiceMaximo,
  aoAlternar,
  aoAlternarDia,
  aoEditar,
}: {
  habito: HabitoDaSemana;
  indiceSelecionado: number;
  indiceMaximo: number;
  aoAlternar: () => void;
  aoAlternarDia: (dia: number) => void;
  aoEditar: () => void;
}) {
  const p = paleta(habito.cor);
  const feito = habito.semana[indiceSelecionado];

  return (
    <Pressable
      onLongPress={aoEditar}
      accessibilityLabel={`Editar ${habito.nome}`}
      accessibilityHint="Segure para editar"
      style={({ pressed }) => [
        estilos.cartao,
        { backgroundColor: p.bg, borderColor: p.borda },
        sombra('suave'),
        pressed && estilos.cartaoPressionado,
      ]}
    >
      <View style={estilos.linha}>
        <View style={[estilos.emojiCaixa, sombra('suave')]}>
          <Text style={estilos.emoji}>{habito.emoji}</Text>
        </View>

        <View style={estilos.textos}>
          <Text style={[estilos.nome, { color: p.texto }]} numberOfLines={2}>
            {habito.nome}
          </Text>
          <Text style={[estilos.contador, { color: p.suave }]}>{contadorDaSemana(habito)}</Text>
        </View>

        <Pressable
          onPress={aoAlternar}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: feito }}
          accessibilityLabel={habito.nome}
          style={({ pressed }) => [
            estilos.check,
            { borderColor: p.borda, backgroundColor: feito ? p.forte : '#ffffff' },
            pressed && estilos.checkPressionado,
          ]}
        >
          {feito ? <Text style={estilos.checkIcone}>✓</Text> : null}
        </Pressable>
      </View>

      <View style={estilos.semana}>
        {DIAS.map((rotulo, i) => {
          const agendado = habito.agenda[i];
          const marcado = habito.semana[i];
          const corBarra = marcado
            ? p.forte
            : agendado
              ? i === indiceSelecionado
                ? p.borda
                : CORES.diaInativo
              : CORES.diaVazio;
          const corRotulo = !agendado
            ? CORES.diaRotuloOff
            : i === indiceSelecionado
              ? p.texto
              : CORES.diaRotuloNeutro;

          return (
            <Pressable
              key={i}
              onPress={() => aoAlternarDia(i)}
              disabled={i > indiceMaximo}
              hitSlop={{ top: 10, bottom: 10 }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcado }}
              accessibilityLabel={`${habito.nome} em ${DIAS_LONGOS[i]}`}
              style={({ pressed }) => [estilos.dia, pressed && estilos.diaPressionado]}
            >
              <View style={[estilos.barraDia, { backgroundColor: corBarra }]} />
              <Text style={[estilos.rotuloDia, { color: corRotulo }]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderRadius: 26, paddingVertical: 15, paddingHorizontal: 16, borderWidth: 1.5, gap: 12 },
  cartaoPressionado: { opacity: 0.7 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiCaixa: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  textos: { flex: 1, gap: 3, minWidth: 0 },
  nome: { fontFamily: F.baloo, fontSize: 16.5, lineHeight: 19 },
  contador: { fontFamily: F.nunito, fontSize: 11.5 },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPressionado: { transform: [{ scale: 0.92 }] },
  checkIcone: { color: '#fff', fontSize: 17, fontFamily: F.baloo },

  semana: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  // Cada coluna marca o proprio dia — a barra tem 7px, entao o alvo de toque
  // vem do padding mais o hitSlop.
  dia: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  diaPressionado: { opacity: 0.5 },
  barraDia: { width: '100%', height: 7, borderRadius: 999 },
  rotuloDia: { fontSize: 9, fontFamily: F.nunitoExtra },
});
