import { Ionicons } from '@expo/vector-icons';

import { TonoAcento } from '../../core/theme';

/**
 * Las cuatro funciones del grid del home.
 *
 * `ruta` y `funcionApi` conectan el diseño con el backend: la primera es la
 * pantalla a la que navega, la segunda el valor que espera `POST /generar`.
 * Tenerlos juntos evita que se desincronicen.
 */

export interface FuncionHome {
  id: string;
  /**
   * Las cuatro rutas enumeradas en vez de un `string` suelto: así un error
   * de dedo lo caza el compilador, y navegar no obliga a forzar el tipo.
   */
  ruta:
    | '/analizar-chat'
    | '/analizar-stories'
    | '/rompehielos'
    | '/crear-notas';
  /** El `funcion` que espera el backend en `/generar`. */
  funcionApi: 'ANALIZAR_CHAT' | 'ROMPEHIELOS' | 'CREAR_NOTAS' | 'ANALIZAR_STORIES';
  icono: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  titulo: string;
  descripcion: string;
}

export const FUNCIONES: readonly FuncionHome[] = [
  {
    id: 'analizar-chat',
    ruta: '/analizar-chat',
    funcionApi: 'ANALIZAR_CHAT',
    icono: 'chatbubble-ellipses',
    tono: 'azul',
    titulo: 'Analizar chats',
    descripcion: 'Obtén la mejor respuesta con IA.',
  },
  {
    id: 'rompehielos',
    ruta: '/rompehielos',
    funcionApi: 'ROMPEHIELOS',
    icono: 'heart',
    tono: 'rosa',
    titulo: 'Rompehielos',
    descripcion: 'Empieza cualquier conversación.',
  },
  {
    id: 'crear-notas',
    ruta: '/crear-notas',
    funcionApi: 'CREAR_NOTAS',
    icono: 'create',
    tono: 'cian',
    titulo: 'Crear notas',
    descripcion: 'Publica notas que llamen la atención.',
  },
  {
    id: 'analizar-stories',
    ruta: '/analizar-stories',
    funcionApi: 'ANALIZAR_STORIES',
    icono: 'logo-instagram',
    tono: 'purpura',
    titulo: 'Analizar Stories',
    descripcion: 'Descubre lo que quiere decir.',
  },
] as const;

export const HERO = {
  titulo: ['Convierte cada', 'chat en una'],
  destacado: 'oportunidad',
  descripcion: 'Sube una captura y deja\nque la IA haga su magia.',
} as const;
