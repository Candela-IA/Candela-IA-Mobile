/**
 * QUIÉN ES PREMIUM Y QUIÉN NO.
 *
 * Es la regla que decide si alguien puede usar lo que pagó, así que se
 * equivoca en las dos direcciones: cortarle el acceso a quien paga es perder
 * un cliente, y regalárselo a quien no paga es regalar el producto.
 *
 * Estas pruebas fijan los casos que no son obvios, que son casi todos.
 */

import {
  Dispositivo,
  EstadoSuscripcion,
  Plataforma,
} from './dispositivo.aggregate';
import { CreditBalance } from '../../credits/domain/credit-balance';

const AHORA = new Date('2026-09-16T12:00:00Z');
const MANANA = new Date('2026-09-17T12:00:00Z');
const AYER = new Date('2026-09-15T12:00:00Z');

function dispositivo(estado: EstadoSuscripcion, expiraEn: Date | null) {
  return new Dispositivo(
    'id',
    'device-key',
    Plataforma.ANDROID,
    CreditBalance.nuevo(AHORA),
    { estado, expiraEn },
  );
}

describe('esPremium', () => {
  it('da acceso a la suscripción activa que no ha vencido', () => {
    expect(dispositivo(EstadoSuscripcion.ACTIVE, MANANA).esPremium(AHORA)).toBe(
      true,
    );
  });

  it('da acceso durante los 3 días de prueba', () => {
    expect(dispositivo(EstadoSuscripcion.TRIAL, MANANA).esPremium(AHORA)).toBe(
      true,
    );
  });

  it('respeta lo pagado a quien canceló pero todavía no vence', () => {
    // Canceló la renovación; pagó hasta cierta fecha y le corresponde usarlo
    // hasta ahí.
    expect(
      dispositivo(EstadoSuscripcion.CANCELLED, MANANA).esPremium(AHORA),
    ).toBe(true);
  });

  it('respeta el período de gracia cuando falla el cobro', () => {
    // Google da 14 días reintentando la tarjeta, y en ese tiempo la persona
    // sigue siendo suscriptora. Quitarle premium el día que le caduca la
    // tarjeta es convertir un problema de tarjeta en una cancelación.
    expect(
      dispositivo(EstadoSuscripcion.BILLING_ISSUE, MANANA).esPremium(AHORA),
    ).toBe(true);
  });

  it('corta el acceso cuando la gracia se agota sin cobrar', () => {
    // El estado sigue siendo BILLING_ISSUE, pero la fecha ya pasó: es lo que
    // impide que la línea anterior regale nada.
    expect(
      dispositivo(EstadoSuscripcion.BILLING_ISSUE, AYER).esPremium(AHORA),
    ).toBe(false);
  });

  it('no da acceso a una suscripción vencida, diga lo que diga el estado', () => {
    // Un webhook perdido puede dejar una fila en ACTIVE con fecha pasada.
    // Sin esta comprobación estaríamos regalando el servicio.
    expect(dispositivo(EstadoSuscripcion.ACTIVE, AYER).esPremium(AHORA)).toBe(
      false,
    );
  });

  it('no da acceso a quien nunca compró', () => {
    expect(dispositivo(EstadoSuscripcion.NONE, null).esPremium(AHORA)).toBe(
      false,
    );
    expect(dispositivo(EstadoSuscripcion.EXPIRED, AYER).esPremium(AHORA)).toBe(
      false,
    );
  });

  it('sin fecha de vencimiento, solo la prueba da acceso', () => {
    // TRIAL puede llegar sin fecha; el resto sin fecha es una fila a medias y
    // ante la duda no se regala nada.
    expect(dispositivo(EstadoSuscripcion.TRIAL, null).esPremium(AHORA)).toBe(
      true,
    );
    expect(dispositivo(EstadoSuscripcion.ACTIVE, null).esPremium(AHORA)).toBe(
      false,
    );
  });
});
