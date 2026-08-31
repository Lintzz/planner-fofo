/**
 * Comemoração de 100% do dia.
 *
 * O design anima 46 papéis caindo com `@keyframes confettiFall`. Aqui a mesma
 * queda é feita com `Animated` em modo nativo, e o cartão "100% do dia!" entra
 * com o mesmo pop elástico do `popIn`.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { CORES, CORES_CONFETE, F, sombra } from '../tema';

const QUANTIDADE = 46;

interface Papel {
  esquerda: number;
  cor: string;
  redondo: boolean;
  duracao: number;
  atraso: number;
  giro: number;
}

export function Confete({ visivel }: { visivel: boolean }) {
  const { width, height } = Dimensions.get('window');

  const papeis = useMemo<Papel[]>(
    () =>
      Array.from({ length: QUANTIDADE }, (_, i) => ({
        esquerda: (Math.random() * 96 + 2) / 100,
        cor: CORES_CONFETE[i % CORES_CONFETE.length],
        redondo: i % 3 === 0,
        duracao: 2100 + Math.random() * 1700,
        atraso: Math.random() * 1100,
        giro: 540,
      })),
    [],
  );

  if (!visivel) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {papeis.map((papel, i) => (
        <Papelzinho key={i} papel={papel} largura={width} altura={height} />
      ))}
      <Cartao />
    </View>
  );
}

function Papelzinho({
  papel,
  largura,
  altura,
}: {
  papel: Papel;
  largura: number;
  altura: number;
}) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: 1,
      duration: papel.duracao,
      delay: papel.atraso,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progresso, papel]);

  const y = progresso.interpolate({ inputRange: [0, 1], outputRange: [-40, altura + 40] });
  const rotate = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${papel.giro}deg`],
  });

  return (
    <Animated.View
      style={[
        estilos.papel,
        {
          left: papel.esquerda * largura,
          width: papel.redondo ? 9 : 7,
          height: papel.redondo ? 9 : 14,
          borderRadius: papel.redondo ? 4.5 : 3,
          backgroundColor: papel.cor,
          transform: [{ translateY: y }, { rotate }],
        },
      ]}
    />
  );
}

function Cartao() {
  const escala = useRef(new Animated.Value(0.7)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(opacidade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [escala, opacidade]);

  return (
    <Animated.View
      style={[
        estilos.cartao,
        sombra('forte'),
        { opacity: opacidade, transform: [{ scale: escala }] },
      ]}
    >
      <Text style={estilos.emoji}>🎉</Text>
      <Text style={estilos.titulo}>100% do dia!</Text>
      <Text style={estilos.texto}>Você cuidou de você hoje. Que orgulho! 💜</Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  papel: { position: 'absolute', top: 0 },
  cartao: {
    position: 'absolute',
    alignSelf: 'center',
    top: '34%',
    backgroundColor: CORES.cartao,
    borderWidth: 2,
    borderColor: '#f9d6ec',
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 26,
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 34 },
  titulo: { fontFamily: F.balooExtra, fontSize: 21, color: CORES.rosaMedio },
  texto: {
    fontFamily: F.nunito,
    fontSize: 12.5,
    color: CORES.apoioForte,
    maxWidth: 190,
    textAlign: 'center',
    lineHeight: 17.5,
  },
});
