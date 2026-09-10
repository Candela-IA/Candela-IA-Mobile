/**
 * Estas pruebas corren sin base de datos, sin NestJS y sin red — esa es la
 * ventaja de tener el dominio aislado. Son instantáneas y verifican las
 * reglas que sostienen el negocio.
 */

import {
  CREDITOS_GRATIS_POR_FUNCION,
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
const NOTAS = Funcion.CREAR_NOTAS;

/** Vacía la bolsa de una función. */
function agotar(saldo: CreditBalance, funcion: Funcion, ahora = AHORA): void {
  for (let i = 0; i < CREDITOS_GRATIS_POR_FUNCION; i++) {
    saldo.consumir(funcion, GRATIS, ahora);
  }
}

describe('CreditBalance', () => {
  describe('usuario gratis', () => {
    it('arranca con todos los intentos de la semana disponibles', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS_POR_FUNCION,
      );
      expect(saldo.puedeGenerar(CHAT, GRATIS, AHORA)).toBe(true);
    });

    it('descuenta uno por cada acción, incluyendo regeneraciones', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, GRATIS, AHORA); // primera generación
      saldo.consumir(CHAT, GRATIS, AHORA); // "Generar otra respuesta"

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS_POR_FUNCION - 2,
      );
    });

    it('se bloquea al agotar los de esa función', () => {
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
   * El motivo del cambio del 5 de septiembre de 2026. Si estas dos se caen,
   * volvimos a la bolsa compartida sin darnos cuenta.
   */
  describe('una bolsa por función', () => {
    it('gastar los de una función no toca las demás', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.puedeGenerar(CHAT, GRATIS, AHORA)).toBe(false);
      expect(saldo.puedeGenerar(NOTAS, GRATIS, AHORA)).toBe(true);
      expect(saldo.gratisRestantes(NOTAS, AHORA)).toBe(
        CREDITOS_GRATIS_POR_FUNCION,
      );
    });

    it('cada función lleva su propia cuenta', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);

      expect(saldo.freeUsed(CHAT)).toBe(1);
      expect(saldo.freeUsed(NOTAS)).toBe(2);
      expect(saldo.freeUsed(Funcion.ANALIZAR_STORIES)).toBe(0);
    });
  });

  describe('renovación semanal de los gratis', () => {
    /** Ya pasada la ventana de 7 días desde AHORA. */
    const SEMANA_DESPUES = new Date('2026-08-21T10:00:00Z');

    it('devuelve los intentos cuando pasa la semana', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.puedeGenerar(CHAT, GRATIS, AHORA)).toBe(false);
      expect(saldo.puedeGenerar(CHAT, GRATIS, SEMANA_DESPUES)).toBe(true);
      expect(saldo.gratisRestantes(CHAT, SEMANA_DESPUES)).toBe(
        CREDITOS_GRATIS_POR_FUNCION,
      );
    });

    it('renueva las cuatro bolsas a la vez', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);
      agotar(saldo, NOTAS);

      // Basta con generar una vez para que el reinicio quede persistido.
      saldo.consumir(CHAT, GRATIS, SEMANA_DESPUES);

      expect(saldo.freeUsed(CHAT)).toBe(1);
      expect(saldo.freeUsed(NOTAS)).toBe(0);
    });

    it('los devuelve aunque no vuelva a generar', () => {
      // El contador se calcula al consultarlo: quien abre la app después de
      // un mes ve sus intentos enteros sin tener que gastar uno primero.
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      const vista = saldo.aVistaUsuario(GRATIS, SEMANA_DESPUES);
      const chat = vista.funciones.find((f) => f.funcion === CHAT)!;

      expect(chat.gratisRestantes).toBe(CREDITOS_GRATIS_POR_FUNCION);
      expect(chat.gratisUsados).toBe(0);
      expect(chat.puedeGenerar).toBe(true);
    });

    it('al renovar arranca una semana nueva', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      saldo.consumir(CHAT, GRATIS, SEMANA_DESPUES);

      expect(saldo.gratisRestantes(CHAT, SEMANA_DESPUES)).toBe(
        CREDITOS_GRATIS_POR_FUNCION - 1,
      );
      expect(saldo.freeResetAt.getTime()).toBeGreaterThan(
        SEMANA_DESPUES.getTime(),
      );
    });

    it('no los devuelve antes de tiempo', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      const dosDiasDespues = new Date('2026-08-15T10:00:00Z');

      expect(saldo.gratisRestantes(CHAT, dosDiasDespues)).toBe(0);
      expect(() => saldo.consumir(CHAT, GRATIS, dosDiasDespues)).toThrow(
        SinCreditosError,
      );
    });
  });

  describe('usuario premium', () => {
    it('no toca los intentos gratis', () => {
      const saldo = CreditBalance.nuevo(AHORA);

      saldo.consumir(CHAT, PREMIUM, AHORA);

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS_POR_FUNCION,
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
    it('devuelve el crédito a la bolsa de la que salió', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);

      saldo.revertir(CHAT, GRATIS);

      expect(saldo.gratisRestantes(CHAT, AHORA)).toBe(
        CREDITOS_GRATIS_POR_FUNCION,
      );
    });

    it('no le regala un intento a otra función', () => {
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
    it('expone un contador por función, tal como se pinta', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);

      const vista = saldo.aVistaUsuario(GRATIS, AHORA);
      const chat = vista.funciones.find((f) => f.funcion === CHAT)!;
      const notas = vista.funciones.find((f) => f.funcion === NOTAS)!;

      // La cabecera de Analizar chat muestra "4/6"...
      expect(chat.gratisUsados).toBe(4);
      expect(chat.gratisTotales).toBe(CREDITOS_GRATIS_POR_FUNCION);
      // ...y la de Crear notas, "0/6".
      expect(notas.gratisUsados).toBe(0);
      expect(vista.funciones).toHaveLength(4);
    });

    it('mantiene la suma para el APK anterior', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      saldo.consumir(CHAT, GRATIS, AHORA);
      saldo.consumir(NOTAS, GRATIS, AHORA);

      const vista = saldo.aVistaUsuario(GRATIS, AHORA);

      expect(vista.gratisUsados).toBe(2);
      expect(vista.gratisTotales).toBe(CREDITOS_GRATIS_POR_FUNCION * 4);
      expect(vista.puedeGenerar).toBe(true);
    });

    it('el resumen solo se apaga cuando no queda nada en ninguna bolsa', () => {
      const saldo = CreditBalance.nuevo(AHORA);
      agotar(saldo, CHAT);

      expect(saldo.aVistaUsuario(GRATIS, AHORA).puedeGenerar).toBe(true);

      for (const funcion of Object.values(Funcion)) {
        if (funcion !== CHAT) agotar(saldo, funcion);
      }

      expect(saldo.aVistaUsuario(GRATIS, AHORA).puedeGenerar).toBe(false);
    });
  });
});
