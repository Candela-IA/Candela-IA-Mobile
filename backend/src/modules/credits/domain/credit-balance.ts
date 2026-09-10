/**
 * SALDO DE CRÉDITOS — el núcleo del modelo de negocio.
 *
 * Regla única y sin excepciones: **1 acción = 1 crédito**. Da igual si es la
 * primera generación o un "Generar otra respuesta".
 *
 * Lo que cambió el 5 de septiembre de 2026, por petición del cliente ("6
 * intentos individuales por cada bloque"): los intentos gratis ya no salen de
 * una bolsa común, sino de una por función. Antes, gastar los seis analizando
 * chats dejaba sin nada a quien todavía no había probado las Stories ni las
 * notas — se chocaba con el muro antes de conocer la app entera, que es justo
 * cuando alguien decide que no vale la pena pagarla.
 *
 * La semana sigue siendo UNA sola para las cuatro: la ventana se renueva a la
 * vez en todas. Cuatro fechas distintas serían imposibles de explicar en
 * pantalla ("te quedan 2 de chat hasta el jueves y 5 de notas hasta el
 * sábado") y no compran nada a cambio.
 *
 * Clase de dominio pura: no importa NestJS ni Prisma. Se puede testear sola.
 */

import { Funcion } from '../../generation/domain/catalogo';
import {
  LimiteDiarioAlcanzadoError,
  SinCreditosError,
} from '../../../shared/domain/domain-error';

/**
 * Intentos gratis POR FUNCIÓN, y cada cuánto vuelven.
 *
 * Antes eran 5 de por vida y compartidos. Se pasó a 6 semanales por petición
 * del cliente, y la práctica le dio la razón: al quedarse sin intentos la
 * gente no paga, cambia de teléfono y sigue gratis — que es exactamente lo
 * que hizo él probando la app desde cinco móviles distintos. Un límite que se
 * esquiva cambiando de aparato no defiende el negocio, solo enseña a
 * esquivarlo.
 *
 * Ojo al leer este número: NO son 24 generaciones gratis a la semana. En
 * Rompehielos el único tono gratis es Básico, y ese sale del banco de frases
 * sin pasar por la IA ni tocar el saldo, así que las bolsas que se gastan de
 * verdad son tres: chat, Stories y notas.
 */
export const CREDITOS_GRATIS_POR_FUNCION = 6;

/** Cada cuántos días vuelven los intentos gratis a cero. */
export const DIAS_RENOVACION_GRATIS = 7;

/**
 * Tope diario para suscriptores. El paywall promete "respuestas ilimitadas",
 * y para el uso humano real lo son. El límite existe para que un bot o un
 * script no destruya el margen del plan anual, no para frenar a un usuario
 * legítimo.
 *
 * Subió de 50 a 100 el 10 de septiembre de 2026: con 50 se toparon Sebastián
 * y el cliente el mismo día probando la app, y a un usuario que se topa el
 * paywall le acaba de mentir. A $0.0009 la generación, 100 son nueve centavos
 * por teléfono y día en el peor caso — el techo real de gasto lo pone el
 * saldo prepago de OpenAI, no esta constante.
 *
 * Ojo con la hora a la que vuelve: se reinicia a MEDIANOCHE UTC, que en Perú
 * son las 7 de la tarde. Un tope "por día" que vuelve a media tarde confunde,
 * y por eso el aviso de la app dice la hora en vez de decir "mañana".
 *
 * Es del dispositivo entero y no de cada función: defiende el gasto de
 * OpenAI, y a ese le da igual de qué pantalla salió la petición.
 */
export const LIMITE_DIARIO_PREMIUM = 100;

/** Las cuatro bolsas de intentos gratis, una por función. */
export type UsoPorFuncion = Readonly<Record<Funcion, number>>;

/** Todas las funciones, en el orden en que las declara el catálogo. */
export const FUNCIONES: readonly Funcion[] = Object.values(Funcion);

/** Bolsas recién estrenadas. */
export function sinUso(): Record<Funcion, number> {
  return {
    [Funcion.ANALIZAR_CHAT]: 0,
    [Funcion.ANALIZAR_STORIES]: 0,
    [Funcion.ROMPEHIELOS]: 0,
    [Funcion.CREAR_NOTAS]: 0,
  };
}

export interface EstadoSaldo {
  readonly freeUsed: UsoPorFuncion;
  /** Cuándo vuelven a cero los intentos gratis. Una sola fecha para las 4. */
  readonly freeResetAt: Date;
  readonly dailyUsed: number;
  readonly dailyResetAt: Date;
  readonly lifetimeUsed: number;
}

/** El contador "4/6" de UNA función. */
export interface SaldoFuncion {
  readonly funcion: Funcion;
  readonly gratisUsados: number;
  readonly gratisTotales: number;
  readonly gratisRestantes: number;
  readonly puedeGenerar: boolean;
}

/**
 * Lo que la app necesita para pintar los contadores.
 *
 * `funciones` es lo que usa la app nueva: cada pantalla busca su entrada y
 * pinta su propio contador.
 *
 * Los cuatro campos sueltos de abajo son la vista sumada, y siguen aquí por
 * el APK que el cliente ya tiene instalado: lee `gratisUsados` y
 * `gratisTotales`, y sin ellos el contador de su cabecera se quedaría vacío
 * el día que se despliegue esto. Se pueden borrar cuando ese APK esté
 * reemplazado.
 */
export interface SaldoVisible {
  readonly esPremium: boolean;
  readonly usadosHoy: number;
  readonly limiteDiario: number | null;
  readonly funciones: readonly SaldoFuncion[];

  /** @deprecated Suma de las cuatro bolsas. Solo para el APK anterior. */
  readonly gratisUsados: number;
  /** @deprecated */
  readonly gratisTotales: number;
  /** @deprecated */
  readonly gratisRestantes: number;
  /** @deprecated ¿Le queda algo en alguna bolsa? */
  readonly puedeGenerar: boolean;
}

export class CreditBalance {
  private constructor(
    private _freeUsed: Record<Funcion, number>,
    private _freeResetAt: Date,
    private _dailyUsed: number,
    private _dailyResetAt: Date,
    private _lifetimeUsed: number,
  ) {}

  static desdePersistencia(estado: EstadoSaldo): CreditBalance {
    return new CreditBalance(
      { ...estado.freeUsed },
      estado.freeResetAt,
      estado.dailyUsed,
      estado.dailyResetAt,
      estado.lifetimeUsed,
    );
  }

  static nuevo(ahora: Date): CreditBalance {
    return new CreditBalance(
      sinUso(),
      siguienteRenovacion(ahora),
      0,
      siguienteMedianoche(ahora),
      0,
    );
  }

  // ── Consultas ───────────────────────────────────────────────────────────

  freeUsed(funcion: Funcion): number {
    return this._freeUsed[funcion] ?? 0;
  }

  get lifetimeUsed(): number {
    return this._lifetimeUsed;
  }

  get dailyResetAt(): Date {
    return this._dailyResetAt;
  }

  /** Uso de hoy, ya considerando si el contador diario venció. */
  usadosHoy(ahora: Date): number {
    return this.debeReiniciarDiario(ahora) ? 0 : this._dailyUsed;
  }

  get freeResetAt(): Date {
    return this._freeResetAt;
  }

  /**
   * Intentos gratis que le quedan en esa función, contando ya si venció la
   * semana.
   *
   * Se calcula en vez de guardarse reiniciado, porque el saldo se consulta
   * mucho más de lo que se modifica: así alguien que abre la app después de
   * un mes ve sus intentos aunque todavía no haya generado nada.
   */
  gratisRestantes(funcion: Funcion, ahora: Date): number {
    const usados = this.debeRenovarGratis(ahora) ? 0 : this.freeUsed(funcion);
    return Math.max(0, CREDITOS_GRATIS_POR_FUNCION - usados);
  }

  /**
   * ¿Puede generar ahora mismo en esa función?
   *
   * - Premium: sí, mientras no supere el tope diario de uso justo.
   * - Gratis: sí, mientras le queden intentos de esa función esta semana.
   */
  puedeGenerar(funcion: Funcion, esPremium: boolean, ahora: Date): boolean {
    if (esPremium) {
      return this.usadosHoy(ahora) < LIMITE_DIARIO_PREMIUM;
    }
    return this.gratisRestantes(funcion, ahora) > 0;
  }

  /** Lo que se le devuelve a la app para pintar los contadores. */
  aVistaUsuario(esPremium: boolean, ahora: Date): SaldoVisible {
    const funciones = FUNCIONES.map((funcion) => {
      const restantes = this.gratisRestantes(funcion, ahora);

      return {
        funcion,
        gratisUsados: CREDITOS_GRATIS_POR_FUNCION - restantes,
        gratisTotales: CREDITOS_GRATIS_POR_FUNCION,
        gratisRestantes: restantes,
        puedeGenerar: this.puedeGenerar(funcion, esPremium, ahora),
      };
    });

    const restantes = funciones.reduce((t, f) => t + f.gratisRestantes, 0);
    const totales = CREDITOS_GRATIS_POR_FUNCION * funciones.length;

    return {
      esPremium,
      usadosHoy: this.usadosHoy(ahora),
      limiteDiario: esPremium ? LIMITE_DIARIO_PREMIUM : null,
      funciones,

      gratisUsados: totales - restantes,
      gratisTotales: totales,
      gratisRestantes: restantes,
      puedeGenerar: funciones.some((f) => f.puedeGenerar),
    };
  }

  // ── Comandos ────────────────────────────────────────────────────────────

  /**
   * Descuenta un crédito de la bolsa de esa función. Lanza si no corresponde.
   *
   * Se llama SIEMPRE antes de invocar a la IA — nunca después. Si la IA
   * falla, se devuelve el crédito con `revertir()`. Al revés (cobrar después)
   * abre la puerta a peticiones simultáneas que se saltan el tope.
   */
  consumir(funcion: Funcion, esPremium: boolean, ahora: Date): void {
    if (this.debeReiniciarDiario(ahora)) {
      this._dailyUsed = 0;
      this._dailyResetAt = siguienteMedianoche(ahora);
    }

    // La semana se renueva aquí y no al consultar: es el único momento en que
    // el saldo se guarda, así que es donde el reinicio queda persistido. Las
    // cuatro bolsas vuelven juntas, que es lo que permite explicar la
    // renovación en una sola frase.
    if (this.debeRenovarGratis(ahora)) {
      this._freeUsed = sinUso();
      this._freeResetAt = siguienteRenovacion(ahora);
    }

    if (esPremium) {
      if (this._dailyUsed >= LIMITE_DIARIO_PREMIUM) {
        throw new LimiteDiarioAlcanzadoError(
          LIMITE_DIARIO_PREMIUM,
          this._dailyResetAt,
        );
      }
    } else {
      if (this.gratisRestantes(funcion, ahora) <= 0) {
        throw new SinCreditosError();
      }
      this._freeUsed[funcion] = this.freeUsed(funcion) + 1;
    }

    this._dailyUsed += 1;
    this._lifetimeUsed += 1;
  }

  /**
   * Devuelve un crédito cuando la generación falló por culpa nuestra
   * (la IA se cayó, timeout, etc.). El usuario no paga nuestros errores.
   */
  revertir(funcion: Funcion, esPremium: boolean): void {
    if (!esPremium && this.freeUsed(funcion) > 0) {
      this._freeUsed[funcion] = this.freeUsed(funcion) - 1;
    }
    if (this._dailyUsed > 0) this._dailyUsed -= 1;
    if (this._lifetimeUsed > 0) this._lifetimeUsed -= 1;
  }

  aPersistencia(): EstadoSaldo {
    return {
      freeUsed: { ...this._freeUsed },
      freeResetAt: this._freeResetAt,
      dailyUsed: this._dailyUsed,
      dailyResetAt: this._dailyResetAt,
      lifetimeUsed: this._lifetimeUsed,
    };
  }

  // ── Interno ─────────────────────────────────────────────────────────────

  private debeReiniciarDiario(ahora: Date): boolean {
    return ahora >= this._dailyResetAt;
  }

  private debeRenovarGratis(ahora: Date): boolean {
    return ahora >= this._freeResetAt;
  }
}

/** Medianoche siguiente en UTC. El contador diario se reinicia ahí. */
function siguienteMedianoche(ahora: Date): Date {
  const siguiente = new Date(ahora);
  siguiente.setUTCHours(24, 0, 0, 0);
  return siguiente;
}

/**
 * Cuándo vuelven los intentos gratis.
 *
 * Siete días desde hoy, a medianoche. Es una ventana rodante y no un día
 * fijo de la semana: quien instala un jueves no tiene que esperar al lunes
 * para estrenar sus intentos, y todo el mundo dispone del mismo plazo.
 */
function siguienteRenovacion(ahora: Date): Date {
  const siguiente = new Date(ahora);
  siguiente.setUTCHours(24, 0, 0, 0);
  siguiente.setUTCDate(siguiente.getUTCDate() + DIAS_RENOVACION_GRATIS - 1);
  return siguiente;
}
