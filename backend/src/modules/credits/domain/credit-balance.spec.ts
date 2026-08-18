/**
 * Estas pruebas corren sin base de datos, sin NestJS y sin red — esa es la
 * ventaja de tener el dominio aislado. Son instantáneas y verifican las
 * reglas que sostienen el negocio.
 */

import {
  CREDITOS_GRATIS,
  CreditBalance,
  LIMITE_DIARIO_PREMIUM,
} from './credit-balance';
import {
  LimiteDiarioAlcanzadoError,
  SinCreditosError,
} from '../../../shared/domain/domain-error';

const AHORA = new Date('2026-08-13T10:00:00Z');
const GRATIS = false;
const PREMIUM = true;

describe('CreditBalance', () => {
  describe('usuario gratis', () => {
    it('arranca con 5 intentos disponibles', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      expect(saldo.gratisRestantes()).toBe(CREDITOS_GRATIS);
      expect(saldo.puedeGenerar(GRATIS, AHORA)).toBe(true);
    });

    it('descuenta uno por cada acción, incluyendo regeneraciones', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(GRATIS, AHORA); // primera generación
      saldo.consumir(GRATIS, AHORA); // "Generar otra respuesta"

      expect(saldo.gratisRestantes()).toBe(3);
    });

    it('se bloquea al agotar los 5', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < CREDITOS_GRATIS; i++) saldo.consumir(GRATIS, AHORA);

      expect(saldo.puedeGenerar(GRATIS, AHORA)).toBe(false);
      expect(() => saldo.consumir(GRATIS, AHORA)).toThrow(SinCreditosError);
    });

    it('NO recupera intentos al día siguiente', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < CREDITOS_GRATIS; i++) saldo.consumir(GRATIS, AHORA);

      const unaSemanaDespues = new Date('2026-08-20T10:00:00Z');

      expect(saldo.puedeGenerar(GRATIS, unaSemanaDespues)).toBe(false);
    });
  });

  describe('usuario premium', () => {
    it('no toca los intentos gratis', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(PREMIUM, AHORA);

      expect(saldo.gratisRestantes()).toBe(CREDITOS_GRATIS);
    });

    it('respeta el tope diario de uso justo', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < LIMITE_DIARIO_PREMIUM; i++) {
        saldo.consumir(PREMIUM, AHORA);
      }

      expect(() => saldo.consumir(PREMIUM, AHORA)).toThrow(
        LimiteDiarioAlcanzadoError,
      );
    });

    it('recupera el tope al día siguiente', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < LIMITE_DIARIO_PREMIUM; i++) {
        saldo.consumir(PREMIUM, AHORA);
      }

      const manana = new Date('2026-08-14T00:00:01Z');

      expect(saldo.puedeGenerar(PREMIUM, manana)).toBe(true);
      expect(saldo.usadosHoy(manana)).toBe(0);
    });
  });

  describe('cuando falla la IA', () => {
    it('devuelve el crédito al usuario gratis', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(GRATIS, AHORA);

      saldo.revertir(GRATIS);

      expect(saldo.gratisRestantes()).toBe(CREDITOS_GRATIS);
    });

    it('devuelve el uso diario al premium', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(PREMIUM, AHORA);

      saldo.revertir(PREMIUM);

      expect(saldo.usadosHoy(AHORA)).toBe(0);
    });
  });

  describe('vista que consume la app', () => {
    it('expone el contador tal como se pinta en pantalla', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(GRATIS, AHORA);
      saldo.consumir(GRATIS, AHORA);
      saldo.consumir(GRATIS, AHORA);
      saldo.consumir(GRATIS, AHORA);

      const vista = saldo.aVistaUsuario(GRATIS, AHORA);

      // La pantalla "Tu respuesta" muestra 4/5
      expect(vista.gratisUsados).toBe(4);
      expect(vista.gratisTotales).toBe(5);
      expect(vista.puedeGenerar).toBe(true);
    });
  });
});
