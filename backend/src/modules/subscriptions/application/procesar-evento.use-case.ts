import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  EventoSuscripcion,
  interpretar,
} from '../domain/evento-suscripcion';
import {
  SUSCRIPCION_REPO,
  SuscripcionRepository,
} from '../domain/suscripcion.repository';

export type ResultadoProceso =
  | { readonly resultado: 'APLICADO'; readonly estado: string }
  | { readonly resultado: 'IGNORADO'; readonly motivo: string };

/**
 * Procesa un evento de suscripción de RevenueCat.
 *
 * Nunca lanza por un evento que simplemente no aplica: devuelve IGNORADO.
 * Al webhook hay que contestarle 200 en cuanto se entendió el mensaje,
 * aunque no cambie nada — si no, RevenueCat lo reintenta durante días
 * creyendo que el servidor está roto.
 *
 * Solo se dejan propagar los fallos de verdad (la base caída, por ejemplo),
 * porque ahí el reintento sí es lo que queremos.
 */
@Injectable()
export class ProcesarEventoUseCase {
  private readonly logger = new Logger(ProcesarEventoUseCase.name);

  constructor(
    @Inject(SUSCRIPCION_REPO)
    private readonly suscripciones: SuscripcionRepository,
  ) {}

  async ejecutar(evento: EventoSuscripcion): Promise<ResultadoProceso> {
    const encontrado = await this.suscripciones.buscarPorDeviceKey(
      evento.appUserId,
    );

    if (!encontrado) {
      // Esto casi siempre significa que la app configuró RevenueCat sin
      // pasarle el deviceKey como appUserID, y entonces NADIE recibe lo que
      // paga. Se registra como error, no como aviso, porque es dinero
      // cobrado sin entregar el servicio.
      this.logger.error(
        `Evento ${evento.tipo} para app_user_id "${evento.appUserId}", que ` +
          'no corresponde a ningún dispositivo registrado. Revisa que la ' +
          'app llame a Purchases.configure({ appUserID: deviceKey }).',
      );

      return {
        resultado: 'IGNORADO',
        motivo: 'app_user_id desconocido',
      };
    }

    const decision = interpretar(evento, encontrado.guardado);

    if (decision.accion === 'IGNORAR') {
      this.logger.log(`${evento.tipo} ignorado: ${decision.motivo}`);
      return { resultado: 'IGNORADO', motivo: decision.motivo };
    }

    await this.suscripciones.aplicar(
      encontrado.deviceId,
      evento.appUserId,
      decision.cambio,
    );

    this.logger.log(
      `${evento.tipo} → ${decision.cambio.estado}` +
        `${decision.cambio.plan ? ` (${decision.cambio.plan})` : ''}` +
        ` · vence ${decision.cambio.expiraEn?.toISOString() ?? 'sin fecha'}`,
    );

    return { resultado: 'APLICADO', estado: decision.cambio.estado };
  }
}
