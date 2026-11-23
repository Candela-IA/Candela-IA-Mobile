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
import { Funcion } from '../../generation/domain/catalogo';
import {
  LimiteDiarioAlcanzadoError,
  SinCreditosError,
} from '../../../shared/domain/domain-error';

const AHORA = new Date('2026-08-13T10:00:00Z');
const GRATIS = false;
const PREMIUM = true;

const CHAT = Funcion.ANALIZAR_CHAT;
const STORIES = Funcion.ANALIZAR_STORIES;
const NOTAS = Funcion.CREAR_NOTAS;

/** Gasta todos los intentos de la semana en una función. */
function agotar(saldo: CreditBalance, funcion: Funcion, ahora = AHORA): void {
  for (let i = 0; i < CREDITOS_GRATIS; i++) {
    saldo.consumir(funcion, GRATIS, ahora);
  }
}

describe('CreditBalance', () => {
  describe('usuario gratis', () => {
    it('arranca con todos los intentos de la semana disponibles', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS,
      );
      expect(saldo.puedeGenerar(CHAT, GRATIS, AHORA)).toBe(true);
    });

    it('son 6', () => {
      // Lo que se le prometió al cliente. Si cambia, que sea a propósito.
      expect(CREDITOS_GRATIS).toBe(6);
    });

    it('descuenta uno por cada acción, incluyendo regeneraciones', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, GRATIS, AHORA); // primera generación
      saldo.consumir(CHAT, GRATIS, AHORA); // "Generar otra respuesta"

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS - 2,
      );
    });

    it('se bloquea al agotarlos', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.puedeGenerar(CHAT, GRATIS, AHORA)).toBe(false);
      expect(() => saldo.consumir(CHAT, GRATIS, AHORA)).toThrow(
        SinCreditosError,
      );
    });

    it('NO recupera intentos al día siguiente', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      const alDiaSiguiente = new Date('2026-08-14T10:00:00Z');

      expect(saldo.puedeGenerar(CHAT, GRATIS, alDiaSiguiente)).toBe(false);
    });
  });

  /**
   * El motivo del cambio del 23 de noviembre de 2026. Si estas se caen,
   * volvimos a las bolsas por función sin darnos cuenta.
   */
  describe('una bolsa común para las cuatro funciones', () => {
    it('gastarlos en una función deja sin intentos a las demás', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.puedeGenerar(NOTAS, GRATIS, AHORA)).toBe(false);
      expect(saldo.gratisRestantes(STORIES, AHORA)).toBe(0);
      expect(() => saldo.consumir(NOTAS, GRATIS, AHORA)).toThrow(
        SinCreditosError,
      );
    });

    it('cuenta lo gastado en todas', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);
      saldo.consumir(STORIES, GRATIS, AHORA);

      for (const funcion of Object.values(Funcion)) {
        expect(saldo.gratisRestantes(funcion, AHORA)).toBe(
          CREDITOS_GRATIS - 3,
        );
      }
    });

    it('sigue anotando en qué función se gastó cada uno', () => {
      // El tope es común, pero el dato por función se guarda: sirve para
      // saber qué usa la gente, y para no necesitar migración.
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);

      expect(saldo.freeUsed(CHAT)).toBe(1);
      expect(saldo.freeUsed(NOTAS)).toBe(2);
      expect(saldo.freeUsed(STORIES)).toBe(0);
    });

    it('quien venía con varias bolsas gastadas se topa con el total', () => {
      // El caso del día del despliegue: un usuario que ya había gastado 3 en
      // chat y 3 en Stories con las bolsas separadas no tiene ninguno más.
      const saldo = CreditBalance.desdePersistencia({
        freeUsed: {
          [Funcion.ANALIZAR_CHAT]: 3,
          [Funcion.ANALIZAR_STORIES]: 3,
          [Funcion.ROMPEHIELOS]: 0,
          [Funcion.CREAR_NOTAS]: 0,
        },
        freeResetAt: new Date('2026-08-20T05:00:00Z'),
        dailyUsed: 0,
        dailyResetAt: new Date('2026-08-14T05:00:00Z'),
        lifetimeUsed: 6,
      });

      expect(saldo.puedeGenerar(NOTAS, GRATIS, AHORA)).toBe(false);
    });
  });

  /**
   * También del 23 de noviembre de 2026: los 6 son de por vida. Si estas se
   * caen, volvió la renovación semanal.
   */
  describe('sin renovación: los 6 son de por vida', () => {
    const UN_MES_DESPUES = new Date('2026-09-13T10:00:00Z');
    const UN_ANIO_DESPUES = new Date('2027-08-13T10:00:00Z');

    it('no los devuelve al pasar la semana', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.puedeGenerar(CHAT, GRATIS, UN_MES_DESPUES)).toBe(false);
      expect(saldo.gratisRestantes(CHAT, UN_ANIO_DESPUES)).toBe(0);
      expect(() => saldo.consumir(CHAT, GRATIS, UN_ANIO_DESPUES)).toThrow(
        SinCreditosError,
      );
    });

    it('lo gastado se queda gastado aunque pase el tiempo', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);

      saldo.consumir(STORIES, GRATIS, UN_MES_DESPUES);

      expect(saldo.freeUsed(CHAT)).toBe(1);
      expect(saldo.freeUsed(NOTAS)).toBe(1);
      expect(saldo.gratisRestantes(CHAT, UN_MES_DESPUES)).toBe(
        CREDITOS_GRATIS - 3,
      );
    });

    it('ignora una fecha de renovación vencida guardada de antes', () => {
      // Los dispositivos de antes del cambio tienen `free_reset_at` en la
      // tabla. Que esa fecha haya pasado ya no regala nada.
      const saldo = CreditBalance.desdePersistencia({
        freeUsed: {
          [Funcion.ANALIZAR_CHAT]: 6,
          [Funcion.ANALIZAR_STORIES]: 0,
          [Funcion.ROMPEHIELOS]: 0,
          [Funcion.CREAR_NOTAS]: 0,
        },
        freeResetAt: new Date('2026-08-01T05:00:00Z'),
        dailyUsed: 0,
        dailyResetAt: new Date('2026-08-14T05:00:00Z'),
        lifetimeUsed: 6,
      });

      expect(saldo.puedeGenerar(CHAT, GRATIS, AHORA)).toBe(false);
      expect(saldo.aVistaUsuario(GRATIS, AHORA).funciones[0].gratisUsados).toBe(
        CREDITOS_GRATIS,
      );
    });
  });

  describe('usuario premium', () => {
    it('no toca los intentos gratis', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, PREMIUM, AHORA);

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS,
      );
    });

    it('respeta el tope diario de uso justo', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < LIMITE_DIARIO_PREMIUM; i++) {
        saldo.consumir(CHAT, PREMIUM, AHORA);
      }

      expect(() => saldo.consumir(CHAT, PREMIUM, AHORA)).toThrow(
        LimiteDiarioAlcanzadoError,
      );
    });

    it('el tope diario es del dispositivo, no de cada función', () => {
      // Defiende el gasto de OpenAI, y a ese le da igual de qué pantalla
      // salió la petición: cambiar de función no lo reinicia.
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < LIMITE_DIARIO_PREMIUM; i++) {
        saldo.consumir(CHAT, PREMIUM, AHORA);
      }

      expect(() => saldo.consumir(NOTAS, PREMIUM, AHORA)).toThrow(
        LimiteDiarioAlcanzadoError,
      );
    });

    it('recupera el tope al día siguiente', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < LIMITE_DIARIO_PREMIUM; i++) {
        saldo.consumir(CHAT, PREMIUM, AHORA);
      }

      // Medianoche del usuario, que estando en UTC-5 son las 05:00 UTC.
      const manana = new Date('2026-08-14T05:00:01Z');

      expect(saldo.puedeGenerar(CHAT, PREMIUM, manana)).toBe(true);
      expect(saldo.usadosHoy(manana)).toBe(0);
    });

    it('el día termina a medianoche del usuario, no a medianoche UTC', () => {
      // La razón de existir de MINUTOS_DESFASE_HORARIO. Con UTC a secas, el
      // contador volvía a cero a las 7 de la tarde en Perú y el usuario veía
      // renovarse su cupo a media tarde, sin explicación posible.
      const saldo = CreditBalance.nuevo(AHORA);
      for (let i = 0; i < LIMITE_DIARIO_PREMIUM; i++) {
        saldo.consumir(CHAT, PREMIUM, AHORA);
      }

      // 00:00 UTC son las 7 de la tarde suyas: su día no ha terminado.
      expect(
        saldo.puedeGenerar(CHAT, PREMIUM, new Date('2026-08-14T00:00:01Z')),
      ).toBe(false);

      // Cinco horas más tarde sí, que ahí son sus 00:00.
      expect(
        saldo.puedeGenerar(CHAT, PREMIUM, new Date('2026-08-14T05:00:01Z')),
      ).toBe(true);
    });
  });

  describe('cuando falla la IA', () => {
    it('devuelve el crédito', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);

      saldo.revertir(CHAT, GRATIS);

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS,
      );
    });

    it('no descuenta de una función en la que no se gastó', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);

      saldo.revertir(NOTAS, GRATIS);

      expect(saldo.freeUsed(CHAT)).toBe(1);
      expect(saldo.freeUsed(NOTAS)).toBe(0);
    });

    it('devuelve el uso diario al premium', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, PREMIUM, AHORA);

      saldo.revertir(CHAT, PREMIUM);

      expect(saldo.usadosHoy(AHORA)).toBe(0);
    });
  });

  describe('vista que consume la app', () => {
    it('todas las pantallas pintan el mismo contador', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);

      const vista = saldo.aVistaUsuario(GRATIS, AHORA);

      // Las cuatro cabeceras dicen "4/6", hayan generado o no en esa pantalla.
      expect(vista.funciones).toHaveLength(4);
      for (const f of vista.funciones) {
        expect(f.gratisUsados).toBe(4);
        expect(f.gratisTotales).toBe(CREDITOS_GRATIS);
        expect(f.gratisRestantes).toBe(2);
      }
    });

    it('los campos sueltos dicen lo mismo, para APKs antiguos', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);

      const vista = saldo.aVistaUsuario(GRATIS, AHORA);

      expect(vista.gratisUsados).toBe(2);
      expect(vista.gratisTotales).toBe(CREDITOS_GRATIS);
      expect(vista.gratisRestantes).toBe(CREDITOS_GRATIS - 2);
      expect(vista.puedeGenerar).toBe(true);
    });

    it('el resumen se apaga al agotar la bolsa común', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.aVistaUsuario(GRATIS, AHORA).puedeGenerar).toBe(false);
    });
  });
});
