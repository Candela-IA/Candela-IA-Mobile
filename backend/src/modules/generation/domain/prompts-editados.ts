/**
 * PROMPTS EDITADOS — "Entrenar a la IA" desde la app.
 *
 * Pedido del cliente el 23 de noviembre de 2026: poder cambiar desde el
 * teléfono cómo responde cada tono de cada función, probarlo y, si le gusta,
 * dejarlo.
 *
 * Lo que se edita es SOLO la instrucción del tono —el bloque "QUÉ BUSCAS /
 * CÓMO SUENA / NUNCA / CALIBRA" de `catalogo.ts`—. La persona, la consigna,
 * las reglas y los ejemplos de `prompt-builder.ts` no se tocan desde aquí:
 * son lo que impide que un cambio con prisa produzca faltas de ortografía,
 * mensajes vulgares o insistencia con alguien que ya dijo que no.
 *
 * Y es uno por función y tono, no uno por tono compartido entre funciones:
 * "Seguro" responde a una conversación en Analizar chat y a una foto en
 * Stories, así que un cambio pensado para uno estropearía el otro.
 *
 * Clase de dominio pura: no importa NestJS ni Prisma.
 */

import { PromptInvalidoError } from '../../../shared/domain/domain-error';
import { Funcion, Tono } from './catalogo';

/** Por debajo de esto no es una instrucción, es un descuido. */
export const LARGO_MINIMO_INSTRUCCION = 20;

/**
 * Las originales rondan los 600 caracteres. 3 000 deja escribir con holgura
 * sin que un pegado accidental de una página entera llegue al modelo en cada
 * petición, que es por donde se paga.
 */
export const LARGO_MAXIMO_INSTRUCCION = 3_000;

/** Un tono editado tal como lo guarda el repositorio. */
export interface PromptEditado {
  readonly funcion: Funcion;
  readonly tonoId: string;
  readonly instruccion: string;
  readonly actualizadoEn: Date;
}

/**
 * Normaliza y valida lo que escribe el cliente. Devuelve el texto listo
 * para guardar o lanza `PromptInvalidoError` con un mensaje para mostrarle.
 */
export function validarInstruccion(texto: string): string {
  const limpio = (texto ?? '').replace(/\r\n/g, '\n').trim();

  if (limpio.length < LARGO_MINIMO_INSTRUCCION) {
    throw new PromptInvalidoError(
      `La instrucción es muy corta: escribe al menos ${LARGO_MINIMO_INSTRUCCION} caracteres.`,
    );
  }
  if (limpio.length > LARGO_MAXIMO_INSTRUCCION) {
    throw new PromptInvalidoError(
      `La instrucción es muy larga: el máximo son ${LARGO_MAXIMO_INSTRUCCION} caracteres.`,
    );
  }

  return limpio;
}

/**
 * El tono con su instrucción reemplazada, o tal cual si no hay edición.
 *
 * Todo lo demás —etiqueta, nivel, color— se queda: el panel cambia CÓMO
 * responde un tono, no si es premium ni cómo se ve en la app.
 */
export function conInstruccion(tono: Tono, instruccion: string | null): Tono {
  return instruccion ? { ...tono, instruccion } : tono;
}

/** Puerto hacia donde se guardan las ediciones. */
export const PROMPTS_EDITADOS = Symbol('PROMPTS_EDITADOS');

export interface PromptsEditadosRepository {
  /** La instrucción editada de ese tono, o null si manda la original. */
  buscar(funcion: Funcion, tonoId: string): Promise<string | null>;
  listar(): Promise<PromptEditado[]>;
  guardar(funcion: Funcion, tonoId: string, instruccion: string): Promise<void>;
  /** Vuelve a la original. No falla si no había edición. */
  borrar(funcion: Funcion, tonoId: string): Promise<void>;
}
