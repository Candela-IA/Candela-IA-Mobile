/**
 * CATÁLOGO DE FUNCIONES Y TONOS
 *
 * Fuente única de verdad de qué puede hacer la app. La app móvil consulta
 * este catálogo por API en vez de tenerlo quemado en el código, así puedes
 * agregar tonos o mover uno a premium sin publicar una versión nueva.
 */

import { TonoInvalidoError } from '../../../shared/domain/domain-error';

export enum Funcion {
  ANALIZAR_CHAT = 'ANALIZAR_CHAT',
  ANALIZAR_STORIES = 'ANALIZAR_STORIES',
  ROMPEHIELOS = 'ROMPEHIELOS',
  CREAR_NOTAS = 'CREAR_NOTAS',
}

export enum Nivel {
  GRATIS = 'GRATIS',
  PREMIUM = 'PREMIUM',
}

export interface Tono {
  /** Identificador estable. Nunca cambia — la app lo manda tal cual. */
  readonly id: string;
  /** Lo que ve el usuario. */
  readonly etiqueta: string;
  readonly emoji: string;
  /** Subtítulo en la tarjeta. Opcional: no todas las pantallas lo muestran. */
  readonly descripcion?: string;
  readonly nivel: Nivel;
  /** Instrucción que se inyecta al prompt. El producto vive aquí. */
  readonly instruccion: string;
}

export interface DefinicionFuncion {
  readonly id: Funcion;
  readonly etiqueta: string;
  readonly requiereImagen: boolean;
  /** Acepta la nota de contexto opcional que escribe el usuario. */
  readonly aceptaContexto: boolean;
  /** Tope de caracteres de la salida. Las notas de IG son 60. */
  readonly maxCaracteres: number | null;
  readonly tonos: readonly Tono[];
}

// ─────────────────────────────────────────────────────────────────────────
// ANALIZAR CHAT
// ─────────────────────────────────────────────────────────────────────────

const TONOS_CHAT: readonly Tono[] = [
  {
    id: 'divertida',
    etiqueta: 'Divertida',
    emoji: '😄',
    nivel: Nivel.GRATIS,
    instruccion:
      'Humor genuino, no chiste de tío. Una observación ingeniosa sobre algo ' +
      'concreto de la conversación. Puede ser absurdo o autoparódico, pero ' +
      'tiene que dar risa de verdad.',
  },
  {
    id: 'seguro',
    etiqueta: 'Seguro',
    emoji: '😎',
    nivel: Nivel.GRATIS,
    instruccion:
      'Confianza tranquila, sin arrogancia. Dice lo que piensa sin pedir ' +
      'permiso ni buscar aprobación. Corto y firme.',
  },
  {
    id: 'ingenioso',
    etiqueta: 'Ingenioso',
    emoji: '🧠',
    nivel: Nivel.GRATIS,
    instruccion:
      'Agudo e inesperado. Juega con las palabras o con la lógica de lo que ' +
      'dijo la otra persona. Hace pensar antes de dar risa.',
  },
  {
    id: 'romantico',
    etiqueta: 'Romántico',
    emoji: '❤️',
    nivel: Nivel.GRATIS,
    instruccion:
      'Cálido y sincero sin ser cursi ni empalagoso. Dice algo bonito de ' +
      'forma original, no con frases hechas.',
  },
  {
    id: 'ligar',
    etiqueta: 'Ligar',
    emoji: '😘',
    nivel: Nivel.GRATIS,
    instruccion:
      'Coqueto con clase. Insinúa interés sin ser explícito ni baboso. ' +
      'La gracia está en lo que NO dice.',
  },
  {
    id: 'dominante',
    etiqueta: 'Dominante',
    emoji: '👑',
    nivel: Nivel.GRATIS,
    instruccion:
      'Toma el control de la conversación con seguridad. Propone en vez de ' +
      'preguntar. Nunca prepotente ni irrespetuoso — seguridad, no ego.',
  },
  {
    id: 'salvar_situacion',
    etiqueta: 'Salvar situación',
    emoji: '🆘',
    nivel: Nivel.PREMIUM,
    instruccion:
      'La conversación se murió o quedó incómoda. Revívela con autoironía ' +
      'sobre el silencio o un giro inesperado. Nunca reclamar el visto ni ' +
      'sonar necesitado.',
  },
  {
    id: 'dar_celos',
    etiqueta: 'Dar celos',
    emoji: '😈',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Insinúa que tienes una vida interesante y opciones, de forma sutil y ' +
      'con humor. NUNCA mentir sobre otra persona ni manipular — es mostrar ' +
      'que tienes mundo propio, no fabricar competencia.',
  },
  {
    id: 'mantener_interes',
    etiqueta: 'Mantener interés',
    emoji: '🎯',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Deja algo en el aire que genere ganas de responder. Menos ' +
      'información, más intriga. Nunca críptico al punto de ser molesto.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// ANALIZAR STORIES
// ─────────────────────────────────────────────────────────────────────────

const TONOS_STORIES: readonly Tono[] = [
  {
    id: 'divertido',
    etiqueta: 'Divertido',
    emoji: '😄',
    descripcion: 'Con humor y chispa',
    nivel: Nivel.GRATIS,
    instruccion: 'Humor genuino sobre algo concreto que se ve en la historia.',
  },
  {
    id: 'romantico',
    etiqueta: 'Romántico',
    emoji: '❤️',
    descripcion: 'Tierno y coqueto',
    nivel: Nivel.GRATIS,
    instruccion: 'Cálido y coqueto sin ser cursi. Original, no frases hechas.',
  },
  {
    id: 'seguro',
    etiqueta: 'Seguro',
    emoji: '😎',
    descripcion: 'Confiado y atractivo',
    nivel: Nivel.GRATIS,
    instruccion: 'Confianza tranquila. Comenta sin buscar aprobación.',
  },
  {
    id: 'atrevido',
    etiqueta: 'Atrevido',
    emoji: '🔥',
    descripcion: 'Audaz y provocador',
    nivel: Nivel.GRATIS,
    instruccion:
      'Se atreve a decir lo que otros no dirían, con picardía. Nunca ' +
      'vulgar ni sexual explícito.',
  },
  {
    id: 'dar_celos',
    etiqueta: 'Dar celos',
    emoji: '😈',
    descripcion: 'Haz que te eche de menos',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Insinúa vida propia interesante, con humor y sutileza. Nunca ' +
      'mentir ni manipular.',
  },
  {
    id: 'mantener_interes',
    etiqueta: 'Mantener interés',
    emoji: '🎯',
    descripcion: 'Respuestas que enganchan',
    nivel: Nivel.PREMIUM,
    instruccion: 'Deja algo en el aire que invite a seguir la conversación.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// ROMPEHIELOS — sin imagen
//
// Modelo distinto al resto: el usuario gratis recibe un rompehielos
// "Básico" sin elegir nada, y los cuatro tonos con personalidad son el
// incentivo para suscribirse. Por eso `basico` es el único gratis y va
// primero: la app preselecciona el primer tono gratis de la lista.
// ─────────────────────────────────────────────────────────────────────────

const TONOS_ROMPEHIELOS: readonly Tono[] = [
  {
    id: 'basico',
    etiqueta: 'Básico',
    emoji: '✨',
    nivel: Nivel.GRATIS,
    instruccion:
      'Un primer mensaje correcto y agradable, fácil de responder. Sin ' +
      'una personalidad marcada: amable y natural, sin arriesgar.',
  },
  {
    id: 'divertido',
    etiqueta: 'Divertido',
    emoji: '😄',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Un primer mensaje que da risa de entrada. Nada de "hola, ¿cómo ' +
      'estás?" — algo que obligue a responder.',
  },
  {
    id: 'misterioso',
    etiqueta: 'Misterioso',
    emoji: '🌙',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Genera curiosidad desde la primera línea. Dice poco y sugiere mucho.',
  },
  {
    id: 'directo',
    etiqueta: 'Directo',
    emoji: '⚡',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Va al grano con seguridad. Dice que le interesa sin rodeos ni ' +
      'arrodillarse. Corto.',
  },
  {
    id: 'romantico',
    etiqueta: 'Romántico',
    emoji: '❤️',
    nivel: Nivel.PREMIUM,
    instruccion: 'Cálido y encantador de entrada, sin sonar cursi ni intenso.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// CREAR NOTAS — sin imagen, máximo 60 caracteres (límite de Instagram)
// ─────────────────────────────────────────────────────────────────────────

const TONOS_NOTAS: readonly Tono[] = [
  {
    id: 'divertidas',
    etiqueta: 'Divertidas',
    emoji: '😄',
    descripcion: 'Con humor y chispa',
    nivel: Nivel.GRATIS,
    instruccion: 'Una nota que da risa y da ganas de contestarla.',
  },
  {
    id: 'romanticas',
    etiqueta: 'Románticas',
    emoji: '❤️',
    descripcion: 'Tiernas y coquetas',
    nivel: Nivel.GRATIS,
    instruccion: 'Cálida y coqueta, sin ser cursi ni obvia.',
  },
  {
    id: 'atrevidas',
    etiqueta: 'Atrevidas',
    emoji: '🔥',
    descripcion: 'Audaces y directas',
    nivel: Nivel.GRATIS,
    instruccion: 'Se atreve a decir algo que otros no pondrían. Nunca vulgar.',
  },
  {
    id: 'indirectas',
    etiqueta: 'Indirectas',
    emoji: '😏',
    descripcion: 'Sutiles e inteligentes',
    nivel: Nivel.GRATIS,
    instruccion:
      'Dirigida a alguien en particular sin nombrarlo. Quien tiene que ' +
      'entenderlo, lo entiende.',
  },
  {
    id: 'mas_impacto',
    etiqueta: 'Más impacto',
    emoji: '💎',
    descripcion: 'Notas que llaman la atención',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Una frase que detiene el scroll. Contundente, memorable, citable.',
  },
  {
    id: 'hacer_pensar',
    etiqueta: 'Hacer que piense',
    emoji: '💭',
    descripcion: 'Notas que generan curiosidad',
    nivel: Nivel.PREMIUM,
    instruccion:
      'Deja una pregunta abierta en la cabeza de quien la lee. Sin ' +
      'responderla.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────────────────────────────────

export const CATALOGO: Readonly<Record<Funcion, DefinicionFuncion>> = {
  [Funcion.ANALIZAR_CHAT]: {
    id: Funcion.ANALIZAR_CHAT,
    etiqueta: 'Analizar chat',
    requiereImagen: true,
    aceptaContexto: true,
    maxCaracteres: null,
    tonos: TONOS_CHAT,
  },
  [Funcion.ANALIZAR_STORIES]: {
    id: Funcion.ANALIZAR_STORIES,
    etiqueta: 'Analizar Stories',
    requiereImagen: true,
    aceptaContexto: false,
    maxCaracteres: null,
    tonos: TONOS_STORIES,
  },
  [Funcion.ROMPEHIELOS]: {
    id: Funcion.ROMPEHIELOS,
    etiqueta: 'Rompehielos',
    requiereImagen: false,
    /**
     * Sin campo de contexto, a diferencia de las otras tres.
     *
     * Es un primer mensaje a alguien con quien nunca se ha hablado: no hay
     * conversación que explicar. La promesa de la pantalla es "un
     * rompehielos al instante", y pedir que escriba algo antes la rompería.
     */
    aceptaContexto: false,
    maxCaracteres: null,
    tonos: TONOS_ROMPEHIELOS,
  },
  [Funcion.CREAR_NOTAS]: {
    id: Funcion.CREAR_NOTAS,
    etiqueta: 'Crear notas',
    requiereImagen: false,
    /**
     * Sin campo de contexto, igual que Rompehielos.
     *
     * Una nota no va dirigida a nadie: la lee todo el que sigue al usuario.
     * No hay conversación ni persona concreta que explicarle a la IA, así
     * que ese campo pedía información que no existe. Y como la pantalla
     * tampoco lleva captura, quitarlo la deja en lo esencial: eliges el
     * tono y generas.
     */
    aceptaContexto: false,
    /// Límite real de las notas de Instagram.
    maxCaracteres: 60,
    tonos: TONOS_NOTAS,
  },
} as const;

export function obtenerFuncion(funcion: Funcion): DefinicionFuncion {
  return CATALOGO[funcion];
}

export function obtenerTono(funcion: Funcion, tonoId: string): Tono {
  const definicion = CATALOGO[funcion];
  const tono = definicion.tonos.find((t) => t.id === tonoId);
  if (!tono) {
    throw new TonoInvalidoError(tonoId, definicion.etiqueta);
  }
  return tono;
}
