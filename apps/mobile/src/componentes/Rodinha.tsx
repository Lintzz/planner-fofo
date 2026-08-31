/**
 * Rodinha de carregando.
 *
 * Substitui o `ActivityIndicator` do React Native, que **não funciona no build
 * de release**: no Android ele renderiza o `AndroidProgressBar`, um componente
 * de `specs_DEPRECATED` que a New Architecture (ligada aqui, `newArchEnabled`)
 * não registra. No modo debug a camada de compatibilidade resolve o view config
 * pela bridge e disfarça; no release, com view configs estáticas, o app morre
 * no primeiro render:
 *
 *     Invariant Violation: View config getter callback for component
 *     `AndroidProgressBar` must be a function (received `undefined`).
 *
 * Aqui é só uma borda girando — nada de componente nativo, então funciona igual
 * nas duas arquiteturas e nos dois sistemas.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, type ColorValue } from 'react-native';

interface Props {
  /** Cor do arco. */
  cor?: ColorValue;
  /** Diâmetro em pixels. O padrão casa com o `size="small"` do RN. */
  tamanho?: number;
}

export default function Rodinha({ cor = '#c98af0', tamanho = 20 }: Props) {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        // Roda na thread de UI: a rodinha não trava enquanto o JS busca dados —
        // que é exatamente quando ela aparece.
        useNativeDriver: true,
      }),
    );
    animacao.start();
    return () => animacao.stop();
  }, [giro]);

  const rotacao = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        borderWidth: Math.max(2, Math.round(tamanho / 10)),
        borderColor: cor,
        // O vão que faz a rotação ser visível.
        borderTopColor: 'transparent',
        transform: [{ rotate: rotacao }],
      }}
    />
  );
}
