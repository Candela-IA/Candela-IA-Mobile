/**
 * Traduce el JSON crudo de RevenueCat a un `EventoSuscripcion`.
 *
 * Es una capa anticorrupción: RevenueCat manda unos veinticinco campos y su
 * formato lo decide un tercero. Aquí se toma solo lo que Candela necesita y
 * se valida a mano, para que el dominio nunca vea la forma ajena.
 *
 * A propósito NO se usa un DTO con class-validator: el `ValidationPipe`
 * global va con `forbidNonWhitelisted`, así que rechazaría con 400 cualquier
 * campo no declarado — y RevenueCat manda muchos. Ese 400 haría que
 * reintentara el mismo evento durante días.
 *
 * Formato: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */

import {
  EventoSuscripcion,
  TipoEvento,
  TipoPeriodo,
} from '../domain/evento-suscripcion';

export class PayloadInvalidoError extends Error {}

export function parsearEvento(cuerpo: unknown): EventoSuscripcion {
  const raiz = comoObjeto(cuerpo, 'el cuerpo de la petición');
  const evento = comoObjeto(raiz.event, 'el campo "event"');

  const id = comoTextoObligatorio(evento.id, 'event.id');
  const tipoCrudo = comoTextoObligatorio(evento.type, 'event.type');
  const appUserId = comoTextoObligatorio(
    evento.app_user_id,
    'event.app_user_id',
  );

  return {
    id,
    // Un tipo desconocido no se rechaza: RevenueCat añade tipos nuevos con
    // el tiempo y devolver un error haría que lo reintentara sin fin. El
    // dominio ya sabe ignorar lo que no reconoce.
    tipo: (tipoCrudo as TipoEvento) ?? TipoEvento.TEST,
    appUserId,
    productoId: comoTextoOpcional(evento.product_id),
    periodo: comoTextoOpcional(evento.period_type) as TipoPeriodo | null,
    expiraEn: comoFecha(evento.expiration_at_ms),
    // Si no viniera la marca de tiempo, usar "ahora" es lo más seguro: el
    // evento se trata como el más reciente y no se descarta por orden.
    ocurrioEn: comoFecha(evento.event_timestamp_ms) ?? new Date(),
  };
}

// ─────────────────────────────────────────────────────────────────────────

function comoObjeto(valor: unknown, donde: string): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new PayloadInvalidoError(`Esperaba un objeto en ${donde}.`);
  }
  return valor as Record<string, unknown>;
}

function comoTextoObligatorio(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new PayloadInvalidoError(`Falta ${campo} o no es texto.`);
  }
  return valor;
}

function comoTextoOpcional(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : null;
}

/** RevenueCat manda las fechas como milisegundos desde epoch. */
function comoFecha(valor: unknown): Date | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
