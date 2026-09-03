/**
 * SALDO DE CRÉDITOS — el núcleo del modelo de negocio.
 *
 * Regla única y sin excepciones: **1 acción = 1 crédito**. Da igual si es la
 * primera generación o un "Generar otra respuesta", y da igual la función.
 * Una sola regla es fácil de explicar al usuario y fácil de defender aquí.
 *
 * Clase de dominio pura: no importa NestJS ni Prisma. Se puede testear sola.
 */

import {
  LimiteDiarioAlcanzadoError,
  SinCreditosError,
} from '../../../shared/domain/domain-error';

/**
 * Intentos gratis, y cada cuánto vuelven.
 *
 * Antes eran 5 y NO se renovaban nunca. Se pasó a 6 cada semana por petición
 * del cliente, y la práctica le dio la razón: al quedarse sin intentos la
 * gente no paga, cambia de teléfono y sigue gratis — que es exactamente lo
 * que hizo él probando la app desde cinco móviles distintos. Un límite que
 * se esquiva cambiando de aparato no defiende el negocio, solo enseña a
 * esquivarlo.
 *
 * Renovándose cada semana, quien la usa de vez en cuando nunca choca contra
 * el muro, y quien la usa a diario tiene un motivo real para pagar.
 */
export const CREDITOS_GRATIS = 6;

/** Cada cuántos días vuelven los intentos gratis a cero. */
export const DIAS_RENOVACION_GRATIS = 7;

/**
 * Tope diario para suscriptores. El paywall promete "respuestas ilimitadas",
 * y para el uso humano real lo son: nadie genera 50 mensajes en un día. El
 * límite existe para que un bot o un script no destruya el margen del plan
 * anual, no para frenar a un usuario legítimo.
 */
export const LIMITE_DIARIO_PREMIUM = 50;

export interface EstadoSaldo {
  readonly freeUsed: number;
  /** Cuándo vuelven a cero los intentos gratis. */
  readonly freeResetAt: Date;
  readonly dailyUsed: number;
  readonly dailyResetAt: Date;
  readonly lifetimeUsed: number;
}

/** Lo que la app necesita pintar en pantalla (el contador "4/5"). */
export interface SaldoVisible {
  readonly esPremium: boolean;
  readonly gratisUsados: number;
  readonly gratisTotales: number;
  readonly gratisRestantes: number;
  readonly usadosHoy: number;
  readonly limiteDiario: number | null;
  readonly puedeGenerar: boolean;
}

export class CreditBalance {
  private constructor(
    private _freeUsed: number,
    private _freeResetAt: Date,
    private _dailyUsed: number,
    private _dailyResetAt: Date,
    private _lifetimeUsed: number,
  ) {}

  static desdePersistencia(estado: EstadoSaldo): CreditBalance {
    return new CreditBalance(
      estado.freeUsed,
      estado.freeResetAt,
      estado.dailyUsed,
      estado.dailyResetAt,
      estado.lifetimeUsed,
    );
  }

  static nuevo(ahora: Date): CreditBalance {
    return new CreditBalance(
      0,
      siguienteRenovacion(ahora),
      0,
      siguienteMedianoche(ahora),
      0,
    );
  }

  // ── Consultas ───────────────────────────────────────────────────────────

  get freeUsed(): number {
    return this._freeUsed;
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
   * Intentos gratis que quedan, contando ya si venció la semana.
   *
   * Se calcula en vez de guardarse reiniciado, porque el saldo se consulta
   * mucho más de lo que se modifica: así alguien que abre la app después de
   * un mes ve sus 6 intentos aunque todavía no haya generado nada.
   */
  gratisRestantes(ahora: Date): number {
    const usados = this.debeRenovarGratis(ahora) ? 0 : this._freeUsed;
    return Math.max(0, CREDITOS_GRATIS - usados);
  }

  /**
   * ¿Puede generar ahora mismo?
   *
   * - Premium: sí, mientras no supere el tope diario de uso justo.
   * - Gratis: sí, mientras le queden intentos de los de esta semana.
   */
  puedeGenerar(esPremium: boolean, ahora: Date): boolean {
    if (esPremium) {
      return this.usadosHoy(ahora) < LIMITE_DIARIO_PREMIUM;
    }
    return this.gratisRestantes(ahora) > 0;
  }

  /** Lo que se le devuelve a la app para pintar el contador. */
  aVistaUsuario(esPremium: boolean, ahora: Date): SaldoVisible {
    const restantes = this.gratisRestantes(ahora);

    return {
      esPremium,
      gratisUsados: CREDITOS_GRATIS - restantes,
      gratisTotales: CREDITOS_GRATIS,
      gratisRestantes: restantes,
      usadosHoy: this.usadosHoy(ahora),
      limiteDiario: esPremium ? LIMITE_DIARIO_PREMIUM : null,
      puedeGenerar: this.puedeGenerar(esPremium, ahora),
    };
  }

  // ── Comandos ────────────────────────────────────────────────────────────

  /**
   * Descuenta un crédito. Lanza excepción si no corresponde.
   *
   * Se llama SIEMPRE antes de invocar a la IA — nunca después. Si la IA
   * falla, se devuelve el crédito con `revertir()`. Al revés (cobrar
   * después) abre la puerta a peticiones simultáneas que se saltan el tope.
   */
  consumir(esPremium: boolean, ahora: Date): void {
    if (this.debeReiniciarDiario(ahora)) {
      this._dailyUsed = 0;
      this._dailyResetAt = siguienteMedianoche(ahora);
    }

    // La semana se renueva aquí y no al consultar: es el único momento en
    // que el saldo se guarda, así que es donde el reinicio queda persistido.
    if (this.debeRenovarGratis(ahora)) {
      this._freeUsed = 0;
      this._freeResetAt = siguienteRenovacion(ahora);
    }

    if (esPremium) {
      if (this._dailyUsed >= LIMITE_DIARIO_PREMIUM) {
        throw new LimiteDiarioAlcanzadoError(LIMITE_DIARIO_PREMIUM);
      }
    } else {
      if (this.gratisRestantes(ahora) <= 0) {
        throw new SinCreditosError();
      }
      this._freeUsed += 1;
    }

    this._dailyUsed += 1;
    this._lifetimeUsed += 1;
  }

  /**
   * Devuelve un crédito cuando la generación falló por culpa nuestra
   * (la IA se cayó, timeout, etc.). El usuario no paga nuestros errores.
   */
  revertir(esPremium: boolean): void {
    if (!esPremium && this._freeUsed > 0) {
      this._freeUsed -= 1;
    }
    if (this._dailyUsed > 0) this._dailyUsed -= 1;
    if (this._lifetimeUsed > 0) this._lifetimeUsed -= 1;
  }

  aPersistencia(): EstadoSaldo {
    return {
      freeUsed: this._freeUsed,
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
