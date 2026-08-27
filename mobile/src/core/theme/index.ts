/**
 * Tema de Candela IA.
 *
 * Escala tipográfica y de espaciado leídas del diseño. Los valores están
 * nombrados por función, no por tamaño ("titulo" en vez de "texto28"), para
 * que un ajuste global no obligue a renombrar nada.
 */

import { TextStyle } from 'react-native';

export { colors, degradados, direccionMarca, resplandor, TONOS } from './colors';
export type { ColorIcono, TonoAcento } from './colors';

/**
 * Escala de espaciado en múltiplos de 4. Mantiene el ritmo vertical
 * consistente sin tener que pensar cada margen.
 */
export const espacio = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Radios del diseño: tarjetas redondeadas, botones tipo píldora. */
export const radio = {
  /** Para la esquina "pegada" de una burbuja de chat. */
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pildora: 999,
} as const;

/**
 * Tipografía.
 *
 * `System` usa Roboto en Android y San Francisco en iOS. Si más adelante
 * quieren una fuente propia, se cambia aquí y en `expo-font`, y toda la app
 * la toma sola.
 */
export const tipografia = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titulo: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitulo: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  seccion: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  cuerpo: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  cuerpoFuerte: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  pequeno: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  /** Las etiquetas tipo "BÁSICO · GRATIS" y "PREMIUM". */
  etiqueta: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  boton: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
} as const satisfies Record<string, TextStyle>;

/** Duraciones de animación, para que todo se sienta del mismo material. */
export const duracion = {
  rapida: 150,
  normal: 250,
  lenta: 400,
  /** Latido de las partículas y auras del fondo. */
  ambiente: 3000,
} as const;

/**
 * Tope al tamaño de letra del sistema.
 *
 * Android deja subir la letra bastante más que esto. Respetarlo sin límite
 * parte los textos de botones y tarjetas en líneas de más; ignorarlo del todo
 * (`allowFontScaling={false}`) deja fuera a quien de verdad lo necesita. 1.3
 * es el punto donde la interfaz sigue creciendo con la preferencia del
 * sistema sin romperse.
 */
export const MAX_ESCALA_FUENTE = 1.3;

/**
 * Convierte un alto pensado para letra normal en uno que aguanta la letra
 * grande del sistema.
 *
 * Un `minHeight` en píxeles no crece cuando el usuario sube el tamaño de
 * letra en los ajustes de Android, pero el texto que va dentro sí. El
 * resultado es texto cortado o desbordado — y es exactamente lo que pasaba
 * en el hero y en las tarjetas del inicio.
 *
 * Se acota con `MAX_ESCALA_FUENTE` porque los propios textos llevan ese mismo
 * tope: reservar más espacio del que el texto puede llegar a ocupar dejaría
 * huecos vacíos.
 *
 * `fontScale` sale de `useWindowDimensions()`, que es reactivo: si el usuario
 * cambia el ajuste con la app abierta, la interfaz se recoloca sola.
 */
export function altoSegunFuente(alto: number, fontScale: number): number {
  return Math.round(alto * Math.min(fontScale, MAX_ESCALA_FUENTE));
}
