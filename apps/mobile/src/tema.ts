/**
 * Ponte entre os design tokens compartilhados e o React Native.
 *
 * As cores, raios e paletas vem todas de `@planner-fofo/shared`. O que mora
 * aqui e apenas o que muda de plataforma: os nomes das fontes carregadas pelo
 * `expo-font` e algumas sombras traduzidas de `box-shadow` para as props do RN.
 */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export {
  CORES,
  CORES_CONFETE,
  GRADIENTES,
  PALETAS,
  RAIOS,
  paleta,
  corDaBarra,
} from '@planner-fofo/shared';
export type { ChavePaleta } from '@planner-fofo/shared';

/** Nomes registrados pelos pacotes @expo-google-fonts. */
export const F = {
  balooSemi: 'Baloo2_600SemiBold',
  baloo: 'Baloo2_700Bold',
  balooExtra: 'Baloo2_800ExtraBold',
  nunitoRegular: 'Nunito_400Regular',
  nunitoSemi: 'Nunito_600SemiBold',
  nunito: 'Nunito_700Bold',
  nunitoExtra: 'Nunito_800ExtraBold',
} as const;

/**
 * Sombras do design. No iOS saem como shadow*, no Android como elevation —
 * o RN nao aceita as duas com o mesmo resultado, entao cada plataforma recebe
 * a aproximacao mais proxima do `box-shadow` original.
 */
export function sombra(
  nivel: 'suave' | 'media' | 'forte',
  cor = '#9254a6',
): ViewStyle {
  const config = {
    suave: { opacidade: 0.1, raio: 12, y: 6, elevation: 2 },
    media: { opacidade: 0.16, raio: 22, y: 10, elevation: 5 },
    forte: { opacidade: 0.3, raio: 30, y: 14, elevation: 10 },
  }[nivel];

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: cor,
      shadowOpacity: config.opacidade,
      shadowRadius: config.raio,
      shadowOffset: { width: 0, height: config.y },
    },
    default: { elevation: config.elevation, shadowColor: cor },
  })!;
}

/** Letter-spacing do design, que no RN e um numero absoluto. */
export const espacado = (v: number): TextStyle => ({ letterSpacing: v });
