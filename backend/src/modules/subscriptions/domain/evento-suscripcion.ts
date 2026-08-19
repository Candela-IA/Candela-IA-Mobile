/**
 * EVENTOS DE SUSCRIPCIÓN DE REVENUECAT
 *
 * Traduce lo que manda RevenueCat a lo que Candela entiende. Es dominio
 * puro: sin NestJS, sin Prisma, sin HTTP. Por eso se puede probar entero sin
 * levantar nada.
 *
 * ── Cómo encaja todo ──────────────────────────────────────────────────────
 *
 *   App: el usuario compra  →  Google Play / App Store cobran
 *                                        ↓
 *                              RevenueCat valida el recibo
 *                                        ↓
 *                          POST /webhooks/revenuecat  ← esto
 *                                        ↓
 *                            tabla `subscriptions`
 *
 * La app NUNCA le dice al backend "ya pagué". No podría: cualquiera con el
 * teléfono rooteado mandaría esa petición. La única fuente de verdad es
 * RevenueCat, que validó el recibo contra la tienda.
 *
 * ⚠️ CONTRATO CON LA APP: al configurar RevenueCat hay que pasarle como
 * `appUserID` el mismo `deviceKey` que usa el backend (ANDROID_ID en
 * Android, UUID de Keychain en iOS):
 *
 *     Purchases.configure({ apiKey, appUserID: deviceKey })
 *
 * Si se deja el ID anónimo que genera RevenueCat, los eventos llegarán con
 * un `app_user_id` que aquí no corresponde a ningún dispositivo y las
 * compras no activarán nada. Es el error más caro de esta integración
 * porque falla en silencio: el usuario paga y no recibe premium.
 */

export enum EstadoSuscripcion {
  NONE = 'NONE',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  BILLING_ISSUE = 'BILLING_ISSUE',
}

export enum PlanSuscripcion {
  WEEKLY = 'WEEKLY',
  ANNUAL = 'ANNUAL',
}

/** Los tipos que RevenueCat puede enviar. */
export enum TipoEvento {
  INITIAL_PURCHASE = 'INITIAL_PURCHASE',
  RENEWAL = 'RENEWAL',
  PRODUCT_CHANGE = 'PRODUCT_CHANGE',
  CANCELLATION = 'CANCELLATION',
  UNCANCELLATION = 'UNCANCELLATION',
  EXPIRATION = 'EXPIRATION',
  BILLING_ISSUE = 'BILLING_ISSUE',
  SUBSCRIPTION_PAUSED = 'SUBSCRIPTION_PAUSED',
  SUBSCRIPTION_EXTENDED = 'SUBSCRIPTION_EXTENDED',
  TRANSFER = 'TRANSFER',
  NON_RENEWING_PURCHASE = 'NON_RENEWING_PURCHASE',
  TEST = 'TEST',
}

/** `period_type` de RevenueCat: en qué fase del ciclo está el cobro. */
export enum TipoPeriodo {
  TRIAL = 'TRIAL',
  INTRO = 'INTRO',
  NORMAL = 'NORMAL',
  PROMOTIONAL = 'PROMOTIONAL',
}

/** El evento ya validado, con los campos que nos importan. */
export interface EventoSuscripcion {
  /** Identificador único del evento. Con esto se descartan los duplicados. */
  readonly id: string;
  readonly tipo: TipoEvento;
  /** El `deviceKey` del dispositivo. Ver el contrato de arriba. */
  readonly appUserId: string;
  readonly productoId: string | null;
  readonly periodo: TipoPeriodo | null;
  readonly expiraEn: Date | null;
  readonly ocurrioEn: Date;
}

// ─────────────────────────────────────────────────────────────────────────
// Traducción
// ─────────────────────────────────────────────────────────────────────────

/**
 * Estado que deja cada tipo de evento.
 *
 * `CANCELLATION` NO corta el acceso: el usuario apagó la renovación, pero
 * pagó hasta cierta fecha y le corresponde usarlo hasta ahí. Quien decide
 * si aún tiene acceso es `Dispositivo.esPremium()`, comparando la fecha de
 * vencimiento. Cortar aquí sería quitarle días que ya pagó.
 *
 * `SUBSCRIPTION_PAUSED` funciona igual: la pausa de Google Play empieza
 * cuando termina el periodo en curso, no al instante.
 */
const ESTADO_POR_EVENTO: Partial<Record<TipoEvento, EstadoSuscripcion>> = {
  [TipoEvento.INITIAL_PURCHASE]: EstadoSuscripcion.ACTIVE,
  [TipoEvento.RENEWAL]: EstadoSuscripcion.ACTIVE,
  [TipoEvento.PRODUCT_CHANGE]: EstadoSuscripcion.ACTIVE,
  [TipoEvento.UNCANCELLATION]: EstadoSuscripcion.ACTIVE,
  [TipoEvento.SUBSCRIPTION_EXTENDED]: EstadoSuscripcion.ACTIVE,
  [TipoEvento.CANCELLATION]: EstadoSuscripcion.CANCELLED,
  [TipoEvento.SUBSCRIPTION_PAUSED]: EstadoSuscripcion.CANCELLED,
  [TipoEvento.EXPIRATION]: EstadoSuscripcion.EXPIRED,
  [TipoEvento.BILLING_ISSUE]: EstadoSuscripcion.BILLING_ISSUE,
};

/**
 * Identificadores de producto de las tiendas.
 *
 * Tienen que coincidir con `productoTienda` de `mobile/src/features/premium/
 * planes.ts` y con lo creado en Play Console y App Store Connect.
 */
const PLAN_POR_PRODUCTO: Record<string, PlanSuscripcion> = {
  candela_premium_anual: PlanSuscripcion.ANNUAL,
  candela_premium_semanal: PlanSuscripcion.WEEKLY,
};

export type Decision =
  | { readonly accion: 'APLICAR'; readonly cambio: CambioSuscripcion }
  | { readonly accion: 'IGNORAR'; readonly motivo: string };

export interface CambioSuscripcion {
  readonly estado: EstadoSuscripcion;
  readonly plan: PlanSuscripcion | null;
  readonly expiraEn: Date | null;
  readonly eventoId: string;
  readonly ocurrioEn: Date;
}

/** Lo que ya está guardado, para decidir si el evento aporta algo. */
export interface EstadoGuardado {
  readonly ultimoEventoId: string | null;
  readonly ultimoEventoEn: Date | null;
}

/**
 * Decide qué hacer con un evento.
 *
 * Devuelve IGNORAR en vez de lanzar cuando el evento es válido pero no
 * aporta nada. Es deliberado: al webhook hay que responderle 200 igual, o
 * RevenueCat lo reintenta durante días creyendo que fallamos.
 */
export function interpretar(
  evento: EventoSuscripcion,
  guardado: EstadoGuardado,
): Decision {
  if (evento.tipo === TipoEvento.TEST) {
    return { accion: 'IGNORAR', motivo: 'Evento de prueba del panel.' };
  }

  // Los eventos de transferencia mueven una compra de un usuario a otro.
  // Con identidad por dispositivo esto solo pasaría si alguien restaura en
  // otro teléfono, y resolverlo mal significaría dejar a dos dispositivos
  // con la misma suscripción o quitársela a quien pagó.
  if (evento.tipo === TipoEvento.TRANSFER) {
    return {
      accion: 'IGNORAR',
      motivo:
        'TRANSFER sin implementar: requiere decidir a qué dispositivo se ' +
        'mueve la suscripción. Revisar a mano.',
    };
  }

  if (evento.tipo === TipoEvento.NON_RENEWING_PURCHASE) {
    return {
      accion: 'IGNORAR',
      motivo: 'Candela solo vende suscripciones renovables.',
    };
  }

  // Duplicado: RevenueCat reintenta ante cualquier fallo de red, así que el
  // mismo evento llega varias veces con toda normalidad.
  if (guardado.ultimoEventoId === evento.id) {
    return { accion: 'IGNORAR', motivo: 'Duplicado, ya procesado.' };
  }

  // Fuera de orden: los reintentos pueden hacer que una RENEWAL vieja
  // llegue después de la EXPIRATION que la sigue. Aplicarla resucitaría una
  // suscripción muerta.
  if (guardado.ultimoEventoEn && evento.ocurrioEn < guardado.ultimoEventoEn) {
    return {
      accion: 'IGNORAR',
      motivo: 'Anterior al último evento procesado; llegó fuera de orden.',
    };
  }

  const estadoBase = ESTADO_POR_EVENTO[evento.tipo];

  if (!estadoBase) {
    return {
      accion: 'IGNORAR',
      motivo: `Tipo de evento no contemplado: ${evento.tipo}`,
    };
  }

  return {
    accion: 'APLICAR',
    cambio: {
      estado: ajustarPorPeriodo(estadoBase, evento.periodo),
      plan: evento.productoId
        ? (PLAN_POR_PRODUCTO[evento.productoId] ?? null)
        : null,
      expiraEn: evento.expiraEn,
      eventoId: evento.id,
      ocurrioEn: evento.ocurrioEn,
    },
  };
}

/**
 * Durante los 3 días de prueba el estado es TRIAL, no ACTIVE.
 *
 * Los dos dan acceso completo —así debe ser: el usuario está probando el
 * producto que le vendiste—, pero distinguirlos permite responder después
 * cuántos de los que prueban terminan pagando, que es el número que decide
 * si el negocio funciona.
 */
function ajustarPorPeriodo(
  estado: EstadoSuscripcion,
  periodo: TipoPeriodo | null,
): EstadoSuscripcion {
  const enPrueba = periodo === TipoPeriodo.TRIAL || periodo === TipoPeriodo.INTRO;

  return estado === EstadoSuscripcion.ACTIVE && enPrueba
    ? EstadoSuscripcion.TRIAL
    : estado;
}
