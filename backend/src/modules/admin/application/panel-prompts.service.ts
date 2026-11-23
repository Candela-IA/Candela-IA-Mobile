import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  ImagenNoEsperadaError,
  ImagenRequeridaError,
  TonoNoEditableError,
} from '../../../shared/domain/domain-error';
import {
  AI_PROVIDER,
  AiProvider,
  ImagenEntrada,
} from '../../generation/domain/ai-provider.port';
import {
  CATALOGO,
  DefinicionFuncion,
  Funcion,
  Nivel,
  obtenerFuncion,
  obtenerTono,
  Tono,
} from '../../generation/domain/catalogo';
import { asegurarMayusculaInicial } from '../../generation/domain/ortografia';
import {
  conInstruccion,
  LARGO_MAXIMO_INSTRUCCION,
  LARGO_MINIMO_INSTRUCCION,
  PROMPTS_EDITADOS,
  PromptEditado,
  PromptsEditadosRepository,
  validarInstruccion,
} from '../../generation/domain/prompts-editados';
import { seSirveDelBanco } from '../../generation/domain/rompehielos';

export interface TonoPanel {
  readonly id: string;
  readonly etiqueta: string;
  readonly emoji: string;
  readonly esPremium: boolean;
  /** La que usa la IA ahora mismo: la editada si la hay. */
  readonly instruccion: string;
  /** La de `catalogo.ts`, para "Restaurar original" y para comparar. */
  readonly instruccionOriginal: string;
  readonly editado: boolean;
  readonly actualizadoEn: string | null;
  /**
   * Otras funciones con un tono del mismo id, a las que se puede copiar la
   * instrucción con "Aplicar también a". Vacío si es el único.
   */
  readonly tambienEn: readonly Funcion[];
}

export interface FuncionPanel {
  readonly id: Funcion;
  readonly etiqueta: string;
  readonly requiereImagen: boolean;
  readonly aceptaContexto: boolean;
  readonly tonos: readonly TonoPanel[];
}

export interface Panel {
  readonly funciones: readonly FuncionPanel[];
  readonly largoMinimo: number;
  readonly largoMaximo: number;
}

export interface Prueba {
  readonly mensaje: string;
  readonly costoUsd: number;
  readonly latenciaMs: number;
}

/**
 * Lo que hace el panel "Entrenar a la IA": listar, guardar, restaurar y
 * probar instrucciones de tono.
 */
@Injectable()
export class PanelPromptsService {
  private readonly logger = new Logger(PanelPromptsService.name);

  constructor(
    @Inject(PROMPTS_EDITADOS)
    private readonly prompts: PromptsEditadosRepository,
    @Inject(AI_PROVIDER)
    private readonly ia: AiProvider,
  ) {}

  async listar(): Promise<Panel> {
    const ediciones = await this.prompts.listar();
    const porClave = new Map<string, PromptEditado>(
      ediciones.map((e) => [clave(e.funcion, e.tonoId), e]),
    );

    const funciones = Object.values(CATALOGO).map(
      (definicion): FuncionPanel => ({
        id: definicion.id,
        etiqueta: definicion.etiqueta,
        requiereImagen: definicion.requiereImagen,
        aceptaContexto: definicion.aceptaContexto,
        tonos: definicion.tonos
          .filter((tono) => !seSirveDelBanco(definicion.id, tono))
          .map((tono) => {
            const edicion = porClave.get(clave(definicion.id, tono.id));
            return {
              id: tono.id,
              etiqueta: tono.etiqueta,
              emoji: tono.emoji,
              esPremium: tono.nivel === Nivel.PREMIUM,
              instruccion: edicion?.instruccion ?? tono.instruccion,
              instruccionOriginal: tono.instruccion,
              editado: Boolean(edicion),
              actualizadoEn: edicion?.actualizadoEn.toISOString() ?? null,
              tambienEn: otrasFuncionesCon(definicion.id, tono.id),
            };
          }),
      }),
    );

    return {
      funciones,
      largoMinimo: LARGO_MINIMO_INSTRUCCION,
      largoMaximo: LARGO_MAXIMO_INSTRUCCION,
    };
  }

  /**
   * Guarda la instrucción en ese tono y, si se pide, en el tono del mismo
   * id de otras funciones. Se valida todo antes de escribir nada: o se
   * guarda en todas, o en ninguna.
   */
  async guardar(
    funcion: Funcion,
    tonoId: string,
    instruccion: string,
    aplicarTambienA: readonly Funcion[] = [],
  ): Promise<Panel> {
    const texto = validarInstruccion(instruccion);

    const destinos = [funcion, ...aplicarTambienA.filter((f) => f !== funcion)];
    for (const destino of destinos) {
      tonoEditable(destino, tonoId);
    }

    for (const destino of destinos) {
      await this.prompts.guardar(destino, tonoId, texto);
    }

    this.logger.log(
      `Prompt editado: ${destinos.join(', ')} / ${tonoId} (${texto.length} caracteres)`,
    );

    return this.listar();
  }

  async restaurar(funcion: Funcion, tonoId: string): Promise<Panel> {
    tonoEditable(funcion, tonoId);
    await this.prompts.borrar(funcion, tonoId);

    this.logger.log(`Prompt restaurado al original: ${funcion} / ${tonoId}`);

    return this.listar();
  }

  /**
   * Genera con una instrucción SIN guardarla, para ver cómo queda.
   *
   * No cobra intentos ni deja rastro en `generations`: no es un usuario
   * usando la app, es el cliente ajustándola. Sí cuesta lo mismo en OpenAI
   * que una generación normal, por eso el controlador le pone tope.
   */
  async probar(datos: {
    funcion: Funcion;
    tonoId: string;
    instruccion: string;
    imagen?: ImagenEntrada;
    contexto?: string;
  }): Promise<Prueba> {
    const texto = validarInstruccion(datos.instruccion);
    const definicion = obtenerFuncion(datos.funcion);
    const tono = tonoEditable(datos.funcion, datos.tonoId);

    exigirImagenSegun(definicion, datos.imagen);

    const resultado = await this.ia.generar({
      funcion: definicion,
      tono: conInstruccion(tono, texto),
      imagen: datos.imagen,
      contextoUsuario: definicion.aceptaContexto ? datos.contexto : undefined,
    });

    return {
      mensaje: asegurarMayusculaInicial(resultado.mensaje).mensaje,
      costoUsd: resultado.costoUsd,
      latenciaMs: resultado.latenciaMs,
    };
  }
}

function clave(funcion: Funcion, tonoId: string): string {
  return `${funcion}/${tonoId}`;
}

/** El tono, si existe en esa función y llega a la IA. Si no, lanza. */
function tonoEditable(funcion: Funcion, tonoId: string): Tono {
  const tono = obtenerTono(funcion, tonoId);
  if (seSirveDelBanco(funcion, tono)) {
    throw new TonoNoEditableError(tono.etiqueta);
  }
  return tono;
}

function otrasFuncionesCon(funcion: Funcion, tonoId: string): Funcion[] {
  return Object.values(CATALOGO)
    .filter((otra) => otra.id !== funcion)
    .filter((otra) =>
      otra.tonos.some((t) => t.id === tonoId && !seSirveDelBanco(otra.id, t)),
    )
    .map((otra) => otra.id);
}

/** Las mismas reglas de imagen que la generación normal. */
function exigirImagenSegun(
  definicion: DefinicionFuncion,
  imagen: ImagenEntrada | undefined,
): void {
  if (definicion.requiereImagen && !imagen) {
    throw new ImagenRequeridaError(definicion.etiqueta);
  }
  if (!definicion.requiereImagen && imagen) {
    throw new ImagenNoEsperadaError(definicion.etiqueta);
  }
}
