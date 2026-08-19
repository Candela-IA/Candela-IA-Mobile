/**
 * Estas pruebas corren sin base de datos, sin NestJS y sin red. Cubren las
 * decisiones que, si se equivocan, o le quitan a alguien lo que pagó o le
 * regalan lo que no.
 */

import {
  EstadoGuardado,
  EstadoSuscripcion,
  EventoSuscripcion,
  interpretar,
  PlanSuscripcion,
  TipoEvento,
  TipoPeriodo,
} from './evento-suscripcion';

const AHORA = new Date('2026-08-17T12:00:00Z');
const EN_UN_ANIO = new Date('2027-08-17T12:00:00Z');

const SIN_NADA_GUARDADO: EstadoGuardado = {
  ultimoEventoId: null,
  ultimoEventoEn: null,
};

function evento(parcial: Partial<EventoSuscripcion> = {}): EventoSuscripcion {
  return {
    id: 'evt_1',
    tipo: TipoEvento.INITIAL_PURCHASE,
    appUserId: 'android-id-de-prueba',
    productoId: 'candela_premium_anual',
    periodo: TipoPeriodo.NORMAL,
    expiraEn: EN_UN_ANIO,
    ocurrioEn: AHORA,
    ...parcial,
  };
}

describe('interpretar evento de RevenueCat', () => {
  describe('compras y renovaciones', () => {
    it('una compra inicial deja la suscripción activa con su plan', () => {
      const decision = interpretar(evento(), SIN_NADA_GUARDADO);

      expect(decision.accion).toBe('APLICAR');
      if (decision.accion !== 'APLICAR') return;

      expect(decision.cambio.estado).toBe(EstadoSuscripcion.ACTIVE);
      expect(decision.cambio.plan).toBe(PlanSuscripcion.ANNUAL);
      expect(decision.cambio.expiraEn).toEqual(EN_UN_ANIO);
    });

    it('reconoce el plan semanal por su identificador de producto', () => {
      const decision = interpretar(
        evento({ productoId: 'candela_premium_semanal' }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.plan).toBe(PlanSuscripcion.WEEKLY);
    });

    it('un producto desconocido se aplica igual, pero sin plan', () => {
      // Si mañana se crea un producto nuevo en la tienda y aquí no está
      // mapeado, es preferible activar la suscripción sin saber el plan que
      // dejar sin premium a alguien que pagó.
      const decision = interpretar(
        evento({ productoId: 'candela_premium_mensual' }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.estado).toBe(EstadoSuscripcion.ACTIVE);
      expect(decision.cambio.plan).toBeNull();
    });

    it('durante los 3 días de prueba el estado es TRIAL, no ACTIVE', () => {
      const decision = interpretar(
        evento({ periodo: TipoPeriodo.TRIAL }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.estado).toBe(EstadoSuscripcion.TRIAL);
    });
  });

  describe('bajas', () => {
    it('cancelar NO corta el acceso: deja CANCELLED con su vencimiento', () => {
      // El usuario apagó la renovación pero pagó hasta cierta fecha. Quien
      // decide si aún tiene acceso es Dispositivo.esPremium() mirando esa
      // fecha; cortar aquí le quitaría días que ya pagó.
      const decision = interpretar(
        evento({ id: 'evt_2', tipo: TipoEvento.CANCELLATION }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.estado).toBe(EstadoSuscripcion.CANCELLED);
      expect(decision.cambio.expiraEn).toEqual(EN_UN_ANIO);
    });

    it('la expiración sí deja EXPIRED', () => {
      const decision = interpretar(
        evento({ id: 'evt_3', tipo: TipoEvento.EXPIRATION }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.estado).toBe(EstadoSuscripcion.EXPIRED);
    });

    it('un problema de cobro queda marcado como tal', () => {
      const decision = interpretar(
        evento({ id: 'evt_4', tipo: TipoEvento.BILLING_ISSUE }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.estado).toBe(EstadoSuscripcion.BILLING_ISSUE);
    });

    it('descancelar vuelve a dejarla activa', () => {
      const decision = interpretar(
        evento({ id: 'evt_5', tipo: TipoEvento.UNCANCELLATION }),
        SIN_NADA_GUARDADO,
      );

      if (decision.accion !== 'APLICAR') throw new Error('debía aplicar');
      expect(decision.cambio.estado).toBe(EstadoSuscripcion.ACTIVE);
    });
  });

  describe('entregas repetidas y desordenadas', () => {
    it('ignora un evento ya procesado', () => {
      const decision = interpretar(evento({ id: 'evt_1' }), {
        ultimoEventoId: 'evt_1',
        ultimoEventoEn: AHORA,
      });

      expect(decision.accion).toBe('IGNORAR');
    });

    it('ignora un evento anterior al último procesado', () => {
      // El caso que importa: una RENEWAL reintentada llega después de la
      // EXPIRATION que la sigue. Aplicarla resucitaría una suscripción
      // muerta y regalaría el servicio.
      const antiguo = new Date('2026-08-10T12:00:00Z');

      const decision = interpretar(
        evento({ id: 'evt_viejo', tipo: TipoEvento.RENEWAL, ocurrioEn: antiguo }),
        { ultimoEventoId: 'evt_nuevo', ultimoEventoEn: AHORA },
      );

      expect(decision.accion).toBe('IGNORAR');
    });

    it('acepta un evento posterior al último procesado', () => {
      const despues = new Date('2026-08-20T12:00:00Z');

      const decision = interpretar(
        evento({ id: 'evt_6', tipo: TipoEvento.RENEWAL, ocurrioEn: despues }),
        { ultimoEventoId: 'evt_5', ultimoEventoEn: AHORA },
      );

      expect(decision.accion).toBe('APLICAR');
    });
  });

  describe('eventos que no tocan nada', () => {
    it('ignora el evento de prueba del panel de RevenueCat', () => {
      const decision = interpretar(
        evento({ tipo: TipoEvento.TEST }),
        SIN_NADA_GUARDADO,
      );

      expect(decision.accion).toBe('IGNORAR');
    });

    it('ignora TRANSFER en vez de adivinar a quién mover la compra', () => {
      const decision = interpretar(
        evento({ id: 'evt_7', tipo: TipoEvento.TRANSFER }),
        SIN_NADA_GUARDADO,
      );

      expect(decision.accion).toBe('IGNORAR');
      if (decision.accion !== 'IGNORAR') return;
      expect(decision.motivo).toContain('mano');
    });

    it('ignora compras no renovables', () => {
      const decision = interpretar(
        evento({ id: 'evt_8', tipo: TipoEvento.NON_RENEWING_PURCHASE }),
        SIN_NADA_GUARDADO,
      );

      expect(decision.accion).toBe('IGNORAR');
    });
  });
});
