/**
 * PALETA DE CANDELA IA
 *
 * Fuente única de verdad del color. Ninguna pantalla escribe un hex a mano:
 * todo sale de aquí. Así un ajuste de marca se hace en un archivo y no
 * cazando valores repetidos por veinte pantallas.
 */

export const colors = {
  // ── Marca ──────────────────────────────────────────────────────────────
  marca: {
    rosa: '#FF2D8A', // principal, CTA
    purpura: '#A855F7',
    azul: '#3B82F6',
    cian: '#22D3EE',
    ambar: '#F59E0B', // ⭐ el color de TODO lo premium
    rose: '#F43F5E',
  },

  // ── Superficies ────────────────────────────────────────────────────────
  fondo: '#09090B',
  tarjeta: '#111118',
  borde: '#242436',

  /** Tonos oscuros para marcos, resplandores y degradados de fondo. */
  oscuro: {
    negro: '#050507',
    profundo: '#0A0A0D',
    violeta: '#0A0710',
    violetaSuave: '#0B0710',
    carbon: '#0B0B12',
    grafito: '#0C0C12',
    ciruela: '#150A1B',
    ciruelaSuave: '#17111A',
    uva: '#1A0620',
    uvaSuave: '#1A0B22',
    magentaOscuro: '#2A0C2A',
  },

  // ── Texto ──────────────────────────────────────────────────────────────
  texto: {
    blanco: '#FFFFFF',
    principal: '#FAFAFA',
    claro: '#D1D1DA',
    medio: '#A7A7B5',
    suave: '#9CA3AF',
    tenue: '#838390',
  },

  // ── Estados ────────────────────────────────────────────────────────────
  estado: {
    exito: '#22C55E',
    premium: '#F59E0B',
  },

  /** Acentos puntuales. */
  extra: {
    purpuraVivo: '#8B3DFF',
    indigo: '#6366F1',
    rosaClaro: '#FF7FC0', // destellos y partículas
  },
} as const;

/**
 * DEGRADADOS
 *
 * Tuplas de color listas para `expo-linear-gradient`. Se tipan como
 * `readonly [string, string, ...string[]]` porque el componente exige al
 * menos dos paradas, y así el error salta al escribir y no en el celular.
 */
type Degradado = readonly [string, string, ...string[]];

export const degradados = {
  /**
   * El degradado de marca: botones principales, textos destacados, bordes
   * activos. En el diseño va a 115°, que en LinearGradient se expresa con
   * los puntos de inicio y fin de `gradienteMarcaDireccion`.
   */
  marca: [
    colors.marca.rosa,
    colors.marca.purpura,
    colors.marca.azul,
  ] as Degradado,

  /** Degradados de los iconos, cada uno con su variante clara y oscura. */
  icono: {
    rosa: ['#FF4D9D', '#C0186A'] as Degradado,
    rose: ['#FB7185', '#BE123C'] as Degradado,
    purpura: ['#C084FC', '#7C22CE'] as Degradado,
    azul: ['#60A5FA', '#1D4FD8'] as Degradado,
    cian: ['#67E8F9', '#0891B2'] as Degradado,
    ambar: ['#FBBF24', '#B45309'] as Degradado,
  },

  /** Fondo de pantalla: negro con el tinte violeta del diseño. */
  pantalla: [
    colors.fondo,
    colors.oscuro.violeta,
    colors.fondo,
  ] as Degradado,
} as const;

/** 115° del diseño, traducido a coordenadas de LinearGradient. */
export const direccionMarca = {
  start: { x: 0, y: 0.3 },
  end: { x: 1, y: 0.7 },
} as const;

export type ColorIcono = keyof typeof degradados.icono;

/**
 * TONOS DE ACENTO — copiado tal cual del prototipo de Figma (`TONE`).
 *
 * Cada tono trae cuatro piezas porque cada una cumple un papel distinto:
 *
 *   rgb   → para componer `rgba(...)` con opacidad (bordes, tintes, brillos)
 *   hex   → color plano (texto, iconos, sombras)
 *   from  → inicio del degradado del icono
 *   to    → fin del degradado del icono
 *
 * React Native no permite `color-mix()` ni alfa sobre un hex, así que tener
 * el `rgb` suelto es lo que hace posible reproducir los bordes translúcidos
 * del diseño sin inventar valores.
 */
export type TonoAcento = 'rosa' | 'rose' | 'purpura' | 'azul' | 'cian' | 'ambar';

export const TONOS: Record<
  TonoAcento,
  { rgb: string; hex: string; from: string; to: string }
> = {
  rosa: { rgb: '255,45,138', hex: '#FF2D8A', from: '#FF4D9D', to: '#C0186A' },
  rose: { rgb: '244,63,94', hex: '#F43F5E', from: '#FB7185', to: '#BE123C' },
  purpura: { rgb: '168,85,247', hex: '#A855F7', from: '#C084FC', to: '#7C22CE' },
  azul: { rgb: '59,130,246', hex: '#3B82F6', from: '#60A5FA', to: '#1D4FD8' },
  cian: { rgb: '34,211,238', hex: '#22D3EE', from: '#67E8F9', to: '#0891B2' },
  ambar: { rgb: '245,158,11', hex: '#F59E0B', from: '#FBBF24', to: '#B45309' },
} as const;

/**
 * Resplandor de color, el efecto neón del diseño.
 *
 * En Android las sombras solo obedecen a `elevation` y no admiten color
 * personalizado, así que ahí el brillo se consigue con capas de opacidad.
 * Esta función da la sombra de iOS; los componentes agregan su propia capa
 * para Android.
 */
export function resplandor(color: string, intensidad = 0.5) {
  return {
    shadowColor: color,
    shadowOpacity: intensidad,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  };
}
