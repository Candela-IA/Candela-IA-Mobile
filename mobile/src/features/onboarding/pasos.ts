import { Ionicons } from '@expo/vector-icons';

import { TonoAcento } from '../../core/theme';

/**
 * CONTENIDO DEL ONBOARDING
 *
 * Los textos separados de las pantallas: así se corrige una palabra sin
 * tocar el código de presentación, y el día que quieran traducir la app
 * ya está todo en un archivo.
 */

export interface ItemLista {
  icono: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  titulo: string;
  descripcion: string;
}

export interface Paso {
  /** Líneas del título. La marcada con `destacar` va en degradado. */
  titulo: { texto: string; destacar?: boolean }[];
  /**
   * El título fluye en un solo párrafo en vez de una línea por entrada, y
   * lo destacado se pinta en rosa dentro de la frase. Es lo que pide la
   * última pantalla: "Enciende el interés" en una sola línea.
   */
  tituloEnLinea?: boolean;
  /** Centra título y descripción. */
  centrado?: boolean;
  /** Tamaño del título. El diseño usa uno distinto en cada pantalla. */
  tamanoTitulo?: number;
  /** Logo grande con "Candela IA" debajo, como cierre de la bienvenida. */
  marcaCentral?: boolean;
  /**
   * La lista va como filas separadas por hilos en vez de tarjetas.
   *
   * En la última pantalla el protagonista es la tarjeta de los 5 intentos
   * gratis; si los beneficios también fueran tarjetas, competirían con ella
   * y ninguno destacaría.
   */
  listaPlana?: boolean;
  descripcion?: string;
  /** Texto pequeño bajo la descripción (pantalla 2). */
  notaAlPie?: string;
  /** Emoji grande dentro de la tarjeta central (pantalla 1). */
  emoji?: string;
  /** Muestra el logo de la app en el centro (pantalla 2). */
  logoCentral?: boolean;
  lista?: ItemLista[];
  textoBoton: string;
  /** La pantalla 1 no lleva "Omitir": obliga a ver el gancho. */
  permiteOmitir: boolean;
}

export const PASOS: readonly Paso[] = [
  {
    titulo: [
      { texto: '¿Sientes que' },
      { texto: 'tu chat' },
      { texto: 'se enfría?', destacar: true },
    ],
    emoji: '🥶',
    descripcion: 'Las conversaciones se apagan cuando no sabes qué responder.',
    textoBoton: 'Comenzar',
    permiteOmitir: false,
  },
  {
    titulo: [
      { texto: 'Con Candela IA,' },
      { texto: 'convierte cada conversación' },
      { texto: 'en una oportunidad.', destacar: true },
    ],
    centrado: true,
    tamanoTitulo: 24,
    logoCentral: true,
    descripcion:
      'Detecta el momento, entiende la intención y encuentra qué decir para mantener la chispa.',
    notaAlPie: 'Respuestas pensadas para cada conversación.',
    textoBoton: 'Continuar',
    permiteOmitir: true,
  },
  {
    titulo: [{ texto: 'Solo sube' }, { texto: 'una captura.', destacar: true }],
    descripcion:
      'Nuestra IA entiende el contexto del chat y te propone respuestas naturales y adaptadas a la conversación.',
    lista: [
      {
        icono: 'camera',
        tono: 'rosa',
        titulo: '1. Captura el chat',
        descripcion: 'Sube una captura de la conversación.',
      },
      {
        icono: 'sparkles',
        tono: 'purpura',
        titulo: '2. La IA analiza y entiende',
        descripcion: 'Analizamos el tono, intención y contexto al instante.',
      },
      {
        icono: 'send',
        tono: 'azul',
        titulo: '3. Obtienes respuestas que funcionan',
        descripcion: 'Respuestas listas para copiar y usar en segundos.',
      },
    ],
    textoBoton: 'Continuar',
    permiteOmitir: true,
  },
  {
    titulo: [
      { texto: 'Empieza conversaciones' },
      { texto: 'que sí funcionan.', destacar: true },
    ],
    descripcion: 'Todo lo que necesitas para mejorar tus conversaciones.',
    lista: [
      {
        icono: 'heart',
        tono: 'rosa',
        titulo: 'Rompehielos',
        descripcion: 'Mensajes creativos para iniciar cualquier conversación.',
      },
      {
        icono: 'logo-instagram',
        tono: 'purpura',
        titulo: 'Analizar Stories',
        descripcion: 'Entiende el contexto de las stories y sabe qué responder.',
      },
      {
        icono: 'create',
        tono: 'cian',
        titulo: 'Crear notas',
        descripcion: 'Publica notas que llamen la atención.',
      },
      {
        icono: 'chatbubble-ellipses',
        tono: 'azul',
        titulo: 'Analizar conversación',
        descripcion: 'Obtén la mejor respuesta con IA.',
      },
    ],
    textoBoton: 'Continuar',
    permiteOmitir: true,
  },
  {
    titulo: [{ texto: 'Enciende el ' }, { texto: 'interés', destacar: true }],
    tituloEnLinea: true,
    centrado: true,
    marcaCentral: true,
    listaPlana: true,
    descripcion:
      'Desbloquea el poder de la IA y lleva tus conversaciones al siguiente nivel.',
    lista: [
      {
        icono: 'sparkles',
        tono: 'rosa',
        titulo: 'Respuestas que conectan',
        descripcion: 'La IA entiende el contexto y te da respuestas adaptadas.',
      },
      {
        icono: 'heart',
        tono: 'rose',
        titulo: 'Más confianza, mejores resultados',
        descripcion: 'Habla con seguridad y mejora tus conversaciones.',
      },
      {
        icono: 'chatbubbles',
        tono: 'azul',
        titulo: 'Para cualquier app',
        descripcion: 'WhatsApp, Instagram, Tinder, Messenger y más.',
      },
      {
        icono: 'shield-checkmark',
        tono: 'purpura',
        titulo: 'Privado y seguro',
        descripcion: 'Tu privacidad es nuestra prioridad.',
      },
    ],
    textoBoton: 'Comenzar ahora',
    permiteOmitir: true,
  },
] as const;

/** Los 5 intentos gratis que anuncia la última pantalla. */
export const REGALO = {
  titulo: 'Por ser nuevo,\ntienes 5 intentos gratis',
  descripcion: 'Pruébalo sin compromiso.',
} as const;

export const SELLOS = [
  { icono: 'checkmark-circle' as const, texto: 'Sin compromiso' },
  { icono: 'lock-closed' as const, texto: 'Pago seguro' },
  { icono: 'flash' as const, texto: 'Acceso inmediato' },
];
