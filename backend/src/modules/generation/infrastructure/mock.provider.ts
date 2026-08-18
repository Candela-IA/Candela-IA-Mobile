import { Injectable, Logger } from '@nestjs/common';

import {
  AiProvider,
  GeneracionFallidaError,
  PeticionGeneracion,
  ResultadoGeneracion,
} from '../domain/ai-provider.port';
import { Funcion } from '../domain/catalogo';

/**
 * Proveedor falso para desarrollo.
 *
 * Devuelve mensajes escritos a mano que se ven como los reales, con una
 * latencia parecida. Sirve para construir toda la app —onboarding, home,
 * pantalla de carga, resultados, paywall— sin API key y sin gastar nada.
 *
 * Se activa con AI_PROVIDER=mock en el .env. Nunca es el valor por defecto:
 * si alguien lo deja puesto en producción, es una decisión explícita, no un
 * descuido silencioso.
 */

/** Latencia simulada, parecida a la real, para probar la pantalla de carga. */
const LATENCIA_MS = { min: 2200, max: 4500 };

const RESPUESTAS: Record<Funcion, readonly string[]> = {
  [Funcion.ANALIZAR_CHAT]: [
    'Hay personas que te hacen querer apagar el teléfono y hay personas que te hacen querer seguir escribiendo. Tú eres de las segundas ❤️',
    'ok pero necesito que sepas que llevo como 3 minutos pensando qué responder y esto fue lo mejor que salió',
    'me caes bien y eso es raro, normalmente me tardo más en decidirlo',
    'estaba haciendo cosas importantes pero apareciste tú en el chat y bueno, ya no',
  ],
  [Funcion.ANALIZAR_STORIES]: [
    'oye esa foto está buenísima pero me distrae más el lugar, ¿dónde queda?',
    'ok necesito saber la historia detrás de esa story porque no me cuadra nada jajaja',
    'te veo muy tranquila ahí mientras yo estoy en modo supervivencia un martes',
  ],
  [Funcion.ROMPEHIELOS]: [
    'hola, vengo a interrumpir tu scroll con una pregunta importante: ¿piña en la pizza sí o no? de tu respuesta depende todo',
    'te escribo sin excusa buena, así que voy con la verdad: me dio curiosidad y aquí estoy',
    'necesito una segunda opinión sobre algo y te elegí a ti completamente al azar (mentira)',
  ],
  [Funcion.CREAR_NOTAS]: [
    'acepto sugerencias de qué hacer un martes cualquiera',
    'hoy ando con energía de responder rápido, aprovechen',
    'busco alguien que me explique por qué me despierto cansada',
  ],
};

@Injectable()
export class MockAiProvider implements AiProvider {
  private readonly logger = new Logger(MockAiProvider.name);
  private contador = 0;

  constructor() {
    this.logger.warn(
      '⚠️  PROVEEDOR FALSO ACTIVO. Las respuestas están escritas a mano, no ' +
        'las genera ninguna IA. Cambia AI_PROVIDER a "openai" en el .env ' +
        'cuando tengas la API key.',
    );
  }

  async generar(peticion: PeticionGeneracion): Promise<ResultadoGeneracion> {
    const inicio = Date.now();

    // Latencia realista: sin esto, la pantalla de carga con su checklist
    // pasaría en un parpadeo y no podrías ajustarla.
    const espera =
      LATENCIA_MS.min +
      Math.floor(Math.random() * (LATENCIA_MS.max - LATENCIA_MS.min));
    await new Promise((r) => setTimeout(r, espera));

    // Permite probar el manejo de errores en la app: con este contexto,
    // el proveedor falla a propósito.
    if (peticion.contextoUsuario?.includes('__fallar__')) {
      throw new GeneracionFallidaError('Fallo simulado para pruebas.', true);
    }

    const opciones = RESPUESTAS[peticion.funcion.id];
    // Rota en vez de elegir al azar: así "Generar otra respuesta" siempre
    // devuelve algo distinto, que es justo lo que quieres probar.
    const mensaje = opciones[this.contador++ % opciones.length]!;

    const max = peticion.funcion.maxCaracteres;
    const recortado =
      max !== null && [...mensaje].length > max
        ? [...mensaje].slice(0, max).join('').trimEnd()
        : mensaje;

    return {
      mensaje: recortado,
      lectura: `[falso] ${peticion.funcion.etiqueta} · tono ${peticion.tono.id}`,
      uso: { entrada: 1250, entradaCacheada: 980, salida: 45 },
      costoUsd: 0,
      latenciaMs: Date.now() - inicio,
    };
  }
}
