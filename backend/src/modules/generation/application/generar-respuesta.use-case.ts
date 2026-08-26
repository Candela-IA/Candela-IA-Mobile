import { Inject, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  DispositivoNoEncontradoError,
  ImagenNoEsperadaError,
  ImagenRequeridaError,
} from '../../../shared/domain/domain-error';
import { SaldoVisible } from '../../credits/domain/credit-balance';
import {
  DISPOSITIVO_REPO,
  DispositivoRepository,
} from '../../devices/domain/dispositivo.repository';
import {
  AI_PROVIDER,
  AiProvider,
  ImagenEntrada,
} from '../domain/ai-provider.port';
import { Dispositivo } from '../../devices/domain/dispositivo.aggregate';
import {
  Funcion,
  Nivel,
  obtenerFuncion,
  obtenerTono,
  Tono,
} from '../domain/catalogo';
import { elegirRompehielos } from '../domain/rompehielos';

export interface ComandoGenerar {
  readonly deviceId: string;
  readonly funcion: Funcion;
  readonly tonoId: string;
  readonly imagen?: ImagenEntrada;
  readonly contexto?: string;
  readonly esRegeneracion: boolean;
  /**
   * El mensaje que el usuario ya tiene en pantalla, si pidió otro.
   *
   * Solo se usa para no devolver el mismo rompehielos dos veces seguidas.
   * No se guarda en ningún sitio.
   */
  readonly mensajeAnterior?: string;
}

export interface RespuestaGenerada {
  readonly generacionId: string;
  readonly mensaje: string;
  readonly saldo: SaldoVisible;
}

/**
 * Orquesta una generación completa.
 *
 * El orden importa y no es casual:
 *
 *   validar → COBRAR → llamar a la IA → guardar métricas
 *                ↑                  ↓
 *                └── devolver si falló ──┘
 *
 * Se cobra ANTES de llamar a la IA. Si se cobrara después, dos peticiones
 * simultáneas pasarían ambas la validación y el usuario obtendría dos
 * generaciones por un crédito. Cobrar primero cierra esa ventana; si la IA
 * falla, se devuelve el crédito y el usuario no paga nuestros errores.
 */
@Injectable()
export class GenerarRespuestaUseCase {
  private readonly logger = new Logger(GenerarRespuestaUseCase.name);

  constructor(
    @Inject(DISPOSITIVO_REPO)
    private readonly dispositivos: DispositivoRepository,
    @Inject(AI_PROVIDER)
    private readonly ia: AiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async ejecutar(comando: ComandoGenerar): Promise<RespuestaGenerada> {
    const ahora = new Date();

    // 1. El catálogo valida que la función y el tono existan y combinen.
    const funcion = obtenerFuncion(comando.funcion);
    const tono = obtenerTono(comando.funcion, comando.tonoId);

    // 2. La imagen tiene que coincidir con lo que la función espera.
    if (funcion.requiereImagen && !comando.imagen) {
      throw new ImagenRequeridaError(funcion.etiqueta);
    }
    if (!funcion.requiereImagen && comando.imagen) {
      throw new ImagenNoEsperadaError(funcion.etiqueta);
    }

    // 3. Los tonos con corona exigen suscripción activa.
    const dispositivo = await this.dispositivos.buscarPorId(comando.deviceId);
    if (!dispositivo) throw new DispositivoNoEncontradoError();

    dispositivo.verificarAccesoATono(tono, ahora);

    // 3.b Rompehielos en su tono gratis sale del banco escrito a mano: ni
    // gasta crédito ni llama a la IA. Ver `domain/rompehielos.ts`.
    if (esRompehielosGratis(funcion.id, tono)) {
      return this.servirDelBanco(comando, tono, dispositivo, ahora);
    }

    // 4. Cobrar. Lanza SinCreditosError o LimiteDiarioAlcanzadoError.
    const cobrado = await this.dispositivos.consumirCredito(
      comando.deviceId,
      ahora,
    );

    // 5. Generar. Desde aquí, cualquier fallo devuelve el crédito.
    try {
      const resultado = await this.ia.generar({
        funcion,
        tono,
        imagen: comando.imagen,
        contextoUsuario: comando.contexto,
        esRegeneracion: comando.esRegeneracion,
      });

      // 6. Métricas. Nunca la imagen ni el texto de la conversación:
      // solo qué función, qué tono y cuánto costó.
      const generacion = await this.prisma.generation.create({
        data: {
          deviceId: comando.deviceId,
          feature: comando.funcion,
          tone: comando.tonoId,
          isRegeneration: comando.esRegeneracion,
          tokensIn: resultado.uso.entrada,
          tokensOut: resultado.uso.salida,
          costUsd: resultado.costoUsd,
          latencyMs: resultado.latenciaMs,
        },
        select: { id: true },
      });

      this.logger.log(
        `${funcion.etiqueta}/${tono.id} · ${resultado.latenciaMs}ms · ` +
          `$${resultado.costoUsd.toFixed(6)} · ` +
          `caché ${resultado.uso.entradaCacheada}/${resultado.uso.entrada}`,
      );

      return {
        generacionId: generacion.id,
        mensaje: resultado.mensaje,
        saldo: cobrado.saldoVisible(ahora),
      };
    } catch (e) {
      // La devolución es best-effort: si también falla, preferimos propagar
      // el error original de la IA, que es el que le importa al usuario.
      await this.dispositivos
        .devolverCredito(comando.deviceId, ahora)
        .catch((errorDevolucion) =>
          this.logger.error(
            `No pude devolver el crédito a ${comando.deviceId}`,
            errorDevolucion,
          ),
        );

      throw e;
    }
  }

  /**
   * Rompehielos gratis: una frase del banco, sin crédito y sin IA.
   *
   * Se registra igual en `generations`, con coste y tokens en cero, porque
   * saber cuánto se usa la función gratuita es justo lo que dice si el
   * gancho funciona. El saldo se devuelve intacto: es lo que la app pinta en
   * el contador, y tiene que seguir marcando los 5 de siempre.
   */
  private async servirDelBanco(
    comando: ComandoGenerar,
    tono: Tono,
    dispositivo: Dispositivo,
    ahora: Date,
  ): Promise<RespuestaGenerada> {
    const mensaje = elegirRompehielos(comando.mensajeAnterior);

    const generacion = await this.prisma.generation.create({
      data: {
        deviceId: comando.deviceId,
        feature: comando.funcion,
        tone: comando.tonoId,
        isRegeneration: comando.esRegeneracion,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: 0,
      },
      select: { id: true },
    });

    this.logger.log(`Rompehielos/${tono.id} · del banco · $0`);

    return {
      generacionId: generacion.id,
      mensaje,
      saldo: dispositivo.saldoVisible(ahora),
    };
  }
}

/**
 * Rompehielos no tiene captura ni contexto: el modelo recibiría siempre la
 * misma petición y devolvería variaciones de lo mismo. Pagar por eso no
 * tiene sentido, así que el tono gratis se sirve del banco. Los premium sí
 * pasan por la IA — ahí está lo que se compra.
 */
function esRompehielosGratis(funcion: Funcion, tono: Tono): boolean {
  return funcion === Funcion.ROMPEHIELOS && tono.nivel === Nivel.GRATIS;
}
