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
