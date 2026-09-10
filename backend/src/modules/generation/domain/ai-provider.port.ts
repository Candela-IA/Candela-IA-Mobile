/**
 * PUERTO hacia el proveedor de IA.
 *
 * El dominio define QUÉ necesita; la infraestructura decide CON QUIÉN.
 * Hoy es GPT-5.6 Luna. Si mañana conviene Gemini o Claude, se escribe otro
 * adaptador y se cambia una línea en el módulo — el resto no se entera.
 *
 * Es una interfaz pura: no importa la librería de OpenAI ni NestJS.
 */

import { DefinicionFuncion, Tono } from './catalogo';

/** Token de inyección de NestJS (las interfaces no existen en runtime). */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface ImagenEntrada {
  /** Contenido en base64, sin el prefijo `data:`. */
  readonly base64: string;
  readonly mimeType: string;
}

export interface PeticionGeneracion {
  readonly funcion: DefinicionFuncion;
  readonly tono: Tono;
  /** Solo en Analizar chat y Analizar Stories. */
  readonly imagen?: ImagenEntrada;
  /** Nota opcional que escribe el usuario ("es mi ex", "la conocí ayer"). */
  readonly contextoUsuario?: string;
  /**
   * El usuario ya vio una respuesta y pidió otra.
   *
   * Sin esto, regenerar manda al modelo una petición idéntica y lo único que
   * cambia el resultado es el azar del muestreo. El usuario gasta un crédito
   * en cada intento, así que merece otro ángulo y no una variación de lo
   * mismo.
   */
  readonly esRegeneracion?: boolean;
  /**
   * Lo que el usuario ya tiene en pantalla, cuando pidió otro.
   *
   * Decirle "cambia el ángulo" no basta si no sabe de qué ángulo viene. En
   * Crear notas, que no tiene captura ni contexto, tres regeneraciones
   * seguidas salían las tres abriendo con "Tengo una teoría": para el modelo
   * cada petición era la primera. Enseñándole lo anterior, la repetición
   * deja de ser invisible.
   *
   * Va en el mensaje de usuario, nunca en el de sistema: el de sistema tiene
   * que seguir siendo idéntico entre peticiones para que se cachee.
   */
  readonly mensajeAnterior?: string;
}

export interface UsoTokens {
  readonly entrada: number;
  readonly entradaCacheada: number;
  readonly salida: number;
}

export interface ResultadoGeneracion {
  /** El mensaje listo para copiar y pegar. */
  readonly mensaje: string;
  /** Lectura interna de la situación. Para depurar, no se muestra al usuario. */
  readonly lectura: string;
  readonly uso: UsoTokens;
  readonly costoUsd: number;
  readonly latenciaMs: number;
}

/** El proveedor se negó a generar (contenido que viola sus políticas). */
export class GeneracionRechazadaError extends Error {
  constructor(readonly categoria: string | null) {
    super('No pude generar una respuesta para esta captura.');
    this.name = 'GeneracionRechazadaError';
  }
}

/**
 * El proveedor pide que bajes el ritmo (429 por límite de peticiones).
 *
 * Tiene clase propia y no es un `GeneracionFallidaError` más porque al
 * usuario hay que decirle algo distinto: no se rompió nada, solo va muy
 * rápido y con esperar unos segundos se arregla. Mezclarlo con los fallos de
 * verdad hacía que la app dijera "algo salió mal" cuando no había salido mal
 * nada.
 *
 * OJO: 429 de OpenAI también significa "se acabó el saldo prepago"
 * (`insufficient_quota`). Ese NO es este error — ahí sí está roto y no lo
 * arregla esperar. Se distinguen por el `code`, no por el status.
 */
export class GeneracionATopeError extends Error {
  constructor() {
    super('El proveedor está limitando las peticiones.');
    this.name = 'GeneracionATopeError';
  }
}

/** Falla técnica: red caída, timeout, error del proveedor. */
export class GeneracionFallidaError extends Error {
  constructor(
    message: string,
    readonly reintentable: boolean,
  ) {
    super(message);
    this.name = 'GeneracionFallidaError';
  }
}

export interface AiProvider {
  generar(peticion: PeticionGeneracion): Promise<ResultadoGeneracion>;
}
