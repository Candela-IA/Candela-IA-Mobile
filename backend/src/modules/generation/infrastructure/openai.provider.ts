import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import {
  AiProvider,
  GeneracionFallidaError,
  GeneracionRechazadaError,
  PeticionGeneracion,
  ResultadoGeneracion,
} from '../domain/ai-provider.port';
import {
  construirMensajeUsuario,
  construirSystemPrompt,
  ESQUEMA_RESPUESTA,
} from '../domain/prompt-builder';

/**
 * Precios de GPT-5.6 Luna, en dólares por millón de tokens (contexto corto).
 * Fuente: developers.openai.com/api/docs/pricing
 *
 * Si cambian, se actualiza aquí y el cálculo de costo sigue siendo correcto
 * en todo el histórico nuevo.
 */
const PRECIO = {
  entrada: 0.2,
  entradaCacheada: 0.02,
  salida: 1.2,
} as const;

const TIMEOUT_MS = 45_000;

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;
  private readonly modelo: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey.startsWith('sk-...')) {
      this.logger.warn(
        'OPENAI_API_KEY no está configurada. El endpoint de generación va a ' +
          'fallar hasta que la pongas en el .env.',
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey ?? 'sin-configurar',
      timeout: TIMEOUT_MS,
      maxRetries: 2,
    });

    this.modelo = config.get<string>('OPENAI_MODEL') ?? 'gpt-5.6-luna';
  }

  async generar(peticion: PeticionGeneracion): Promise<ResultadoGeneracion> {
    const { funcion, tono, imagen, contextoUsuario, esRegeneracion } =
      peticion;
    const inicio = Date.now();

    const contenidoUsuario: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: construirMensajeUsuario(funcion, contextoUsuario, esRegeneracion),
      },
    ];

    if (imagen) {
      contenidoUsuario.push({
        type: 'image_url',
        image_url: {
          url: `data:${imagen.mimeType};base64,${imagen.base64}`,
          detail: 'high',
        },
      });
    }

    let completion: OpenAI.Chat.ChatCompletion;

    try {
      completion = await this.client.chat.completions.create({
        model: this.modelo,
        max_completion_tokens: 600,
        messages: [
          // El prompt de sistema es idéntico entre peticiones del mismo
          // tono, así que OpenAI lo cachea automáticamente (90% menos).
          { role: 'system', content: construirSystemPrompt(funcion, tono) },
          { role: 'user', content: contenidoUsuario },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'respuesta_candela',
            schema: ESQUEMA_RESPUESTA as unknown as Record<string, unknown>,
            strict: true,
          },
        },
      });
    } catch (e) {
      throw this.traducirError(e);
    }

    const eleccion = completion.choices[0];

    // Con salidas estructuradas, el modelo puede devolver `refusal` en vez
    // de contenido cuando la petición choca con sus políticas.
    if (eleccion?.message.refusal) {
      this.logger.warn(`Rechazo del modelo: ${eleccion.message.refusal}`);
      throw new GeneracionRechazadaError(null);
    }

    const crudo = eleccion?.message.content;
    if (!crudo) {
      throw new GeneracionFallidaError('El modelo no devolvió contenido.', true);
    }

    let datos: { mensaje: string; lectura: string };
    try {
      datos = JSON.parse(crudo);
    } catch {
      throw new GeneracionFallidaError(
        'El modelo devolvió una respuesta ilegible.',
        true,
      );
    }

    const mensaje = this.recortarSiHaceFalta(
      datos.mensaje?.trim() ?? '',
      funcion.maxCaracteres,
    );

    if (!mensaje) {
      throw new GeneracionFallidaError('El modelo devolvió un mensaje vacío.', true);
    }

    const uso = {
      entrada: completion.usage?.prompt_tokens ?? 0,
      entradaCacheada:
        completion.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      salida: completion.usage?.completion_tokens ?? 0,
    };

    return {
      mensaje,
      lectura: datos.lectura?.trim() ?? '',
      uso,
      costoUsd: this.calcularCosto(uso),
      latenciaMs: Date.now() - inicio,
    };
  }

  /**
   * Red de seguridad para el límite de 60 caracteres de las notas de IG.
   * El prompt ya lo pide, pero el modelo puede pasarse por uno o dos — y una
   * nota que Instagram corta a la mitad es peor que una nota corta.
   */
  private recortarSiHaceFalta(texto: string, max: number | null): string {
    if (max === null || [...texto].length <= max) return texto;

    this.logger.warn(`Mensaje de ${[...texto].length} caracteres, recortando a ${max}.`);
    // Se recorta por puntos de código para no partir un emoji por la mitad.
    return [...texto].slice(0, max).join('').trimEnd();
  }

  private calcularCosto(uso: {
    entrada: number;
    entradaCacheada: number;
    salida: number;
  }): number {
    const entradaNueva = Math.max(0, uso.entrada - uso.entradaCacheada);

    return (
      (entradaNueva / 1_000_000) * PRECIO.entrada +
      (uso.entradaCacheada / 1_000_000) * PRECIO.entradaCacheada +
      (uso.salida / 1_000_000) * PRECIO.salida
    );
  }

  private traducirError(e: unknown): Error {
    if (e instanceof OpenAI.APIError) {
      const reintentable = e.status === 429 || (e.status ?? 0) >= 500;

      this.logger.error(`OpenAI ${e.status}: ${e.message}`);

      if (e.status === 401) {
        return new GeneracionFallidaError(
          'La API key de OpenAI es inválida o no está configurada.',
          false,
        );
      }
      if (e.status === 429) {
        return new GeneracionFallidaError(
          'Estamos a tope en este momento. Intenta en unos segundos.',
          true,
        );
      }
      return new GeneracionFallidaError(e.message, reintentable);
    }

    if (e instanceof OpenAI.APIConnectionTimeoutError) {
      return new GeneracionFallidaError('La generación tardó demasiado.', true);
    }

    this.logger.error('Error inesperado del proveedor', e as Error);
    return new GeneracionFallidaError('Error inesperado al generar.', true);
  }
}
