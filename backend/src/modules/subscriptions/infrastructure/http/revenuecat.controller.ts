import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiExcludeController,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ProcesarEventoUseCase } from '../../application/procesar-evento.use-case';
import {
  parsearEvento,
  PayloadInvalidoError,
} from '../revenuecat.payload';
import { RevenueCatGuard } from './revenuecat.guard';

/**
 * WEBHOOK DE REVENUECAT
 *
 * La única vía por la que una suscripción se activa. La app nunca puede
 * decir "ya pagué": ese mensaje se puede falsificar desde un teléfono
 * rooteado. RevenueCat valida el recibo contra Google Play o Apple y avisa
 * aquí.
 *
 * Queda fuera de Swagger a propósito: no es una API para la app, es un
 * punto de entrada de un tercero, y publicar su forma solo ayuda a quien
 * quiera imitarlo.
 *
 * ── Configurar en producción ──────────────────────────────────────────────
 *
 *   1. Panel de RevenueCat → Integrations → Webhooks
 *   2. URL:  https://<dominio>/api/v1/webhooks/revenuecat
 *   3. Authorization header: el mismo valor que REVENUECAT_WEBHOOK_SECRET
 *   4. Botón "Send test event" → debe responder 200 y registrar
 *      "TEST ignorado" en los logs
 */
@ApiTags('Webhooks')
@ApiExcludeController()
@Controller({ path: 'webhooks/revenuecat', version: '1' })
export class RevenueCatController {
  private readonly logger = new Logger(RevenueCatController.name);

  constructor(private readonly procesar: ProcesarEventoUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RevenueCatGuard)
  // Sin límite por IP: todos los eventos llegan desde las mismas direcciones
  // de RevenueCat, y una racha de renovaciones se vería como un ataque. Un
  // 429 aquí haría que reintentara durante días. Quien protege este endpoint
  // es el guard, no el contador de peticiones.
  @SkipThrottle()
  @ApiOperation({ summary: 'Eventos de suscripción de RevenueCat' })
  async recibir(
    // `unknown` a propósito: con un DTO, el ValidationPipe global rechazaría
    // con 400 los muchos campos que RevenueCat manda y no declaramos.
    // La validación la hace `parsearEvento`.
    @Body() cuerpo: unknown,
  ): Promise<{ recibido: true }> {
    let evento;

    try {
      evento = parsearEvento(cuerpo);
    } catch (e) {
      if (e instanceof PayloadInvalidoError) {
        // Se responde 200 aunque no se entienda. Un evento con forma
        // inesperada no mejora reintentándolo: volvería igual de roto cada
        // vez. Queda el log para revisarlo.
        this.logger.error(`Payload que no supe leer: ${e.message}`);
        return { recibido: true };
      }
      throw e;
    }

    await this.procesar.ejecutar(evento);

    // Siempre 200: el evento se recibió y se decidió qué hacer con él. Los
    // fallos reales —base de datos caída— se propagan como 500 y ahí sí
    // conviene que RevenueCat reintente.
    return { recibido: true };
  }
}
