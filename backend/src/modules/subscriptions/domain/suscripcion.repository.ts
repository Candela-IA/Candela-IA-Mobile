/**
 * PUERTO de persistencia de suscripciones.
 *
 * El dominio declara qué necesita; la infraestructura decide con qué.
 */

import { CambioSuscripcion, EstadoGuardado } from './evento-suscripcion';

export const SUSCRIPCION_REPO = Symbol('SUSCRIPCION_REPO');

export interface SuscripcionEncontrada {
  readonly deviceId: string;
  readonly guardado: EstadoGuardado;
}

export interface SuscripcionRepository {
  /**
   * Busca por el `deviceKey`, que es lo que RevenueCat manda como
   * `app_user_id`. Devuelve `null` si ese dispositivo no está registrado.
   */
  buscarPorDeviceKey(deviceKey: string): Promise<SuscripcionEncontrada | null>;

  /**
   * Guarda el nuevo estado junto con el identificador y la fecha del evento
   * que lo produjo. Los tres tienen que escribirse a la vez: si el estado se
   * guardara sin su `eventoId`, el mismo evento reintentado volvería a
   * aplicarse como si fuera nuevo.
   */
  aplicar(
    deviceId: string,
    rcUserId: string,
    cambio: CambioSuscripcion,
  ): Promise<void>;
}
