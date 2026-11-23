/**
 * SALDO DE CRÉDITOS — el núcleo del modelo de negocio.
 *
 * Regla única y sin excepciones: **1 acción = 1 crédito**. Da igual si es la
 * primera generación o un "Generar otra respuesta".
 *
 * Historia de las bolsas, porque ya dio dos vueltas:
 *
 * - Hasta el 5 de septiembre de 2026, una bolsa común.
 * - Del 5 de septiembre al 23 de noviembre de 2026, una por función ("6
 *   intentos individuales por cada bloque").
 * - Desde el 23 de noviembre de 2026, OTRA VEZ una bolsa común de 6 para las
 *   cuatro, por petición del cliente ("6 puntos para todos, generales"), y
 *   DE POR VIDA: ya no se renuevan cada semana.
 *
 * El uso se sigue GUARDANDO por función —las cuatro columnas de
 * `credit_balances` no se tocan— y lo que cambió es la regla: el tope se
 * mide contra la SUMA. Así no hizo falta migración, el `SELECT ... FOR
 * UPDATE` sigue protegiendo el saldo entero con un solo bloqueo, y se sigue
 * sabiendo en qué gasta la gente sus intentos.
 *
 * Clase de dominio pura: no importa NestJS ni Prisma. Se puede testear sola.
 */

import { Funcion } from '../../generation/domain/catalogo';
import {
  LimiteDiarioAlcanzadoError,
  SinCreditosError,
} from '../../../shared/domain/domain-error';

/**
 * Intentos gratis DE POR VIDA, COMPARTIDOS entre las cuatro funciones.
 *
 * Desde el 23 de noviembre de 2026, por petición del cliente: "todas las
 * funciones deben tener 6 intentos únicamente, y por siempre, no a la
 * semana". Son 6 en total y no vuelven: quien gasta 4 en chats tiene 2 para
 * todo lo demás, y después, suscripción.
 *
 * Cuentan TODOS, también el Básico de Rompehielos. Ese se sigue sirviendo
 * del banco de frases —no cuesta nada de OpenAI—, pero gasta un intento
 * como cualquier otro.
 *
 * Antes fueron 5 de por vida, luego 6 semanales (del 25 de agosto al 23 de
 * noviembre de 2026).
 */
export const CREDITOS_GRATIS = 6;

/**
 * Días de la vieja renovación semanal.
 *
 * Ya no renueva nada. Solo sirve para rellenar la columna `free_reset_at`
 * de los dispositivos nuevos, que sigue en la tabla para no migrar.
 */
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
 * Vuelve al terminar el día del usuario, a medianoche de su huso. El aviso
 * de la app dice la hora exacta en vez de "mañana", porque a las 11 de la
 * noche "mañana" y "en una hora" son la misma cosa y no se parecen en nada.
 *
 * Es del dispositivo entero y no de cada función: defiende el gasto de
 * OpenAI, y a ese le da igual de qué pantalla salió la petición.
 */
export const LIMITE_DIARIO_PREMIUM = 100;

/**
 * Minutos de desfase con UTC del huso en el que vive el usuario.
 *
 * Lo que se reinicia "al terminar el día" —el tope diario de premium— lo
 * hace a MEDIANOCHE DE ESE HUSO, no a medianoche UTC.
 *
 * Antes era UTC a secas, y en Perú eso caía a las 7 de la tarde: el usuario
 * veía su contador volver a cero a media tarde, sin explicación posible. Un
 * límite "por día" tiene que terminar cuando termina el día de quien lo usa.
 *
 * -300 son las 5 horas de Perú, Colombia y Ecuador. Es una sola constante
 * para toda la app porque hoy se vende ahí; cuando el mercado se abra de
 * verdad, esto pasa a ser un dato del dispositivo —la app conoce su huso y
 * lo puede mandar al registrarse— y esta constante se queda de valor por
 * defecto para las filas que no lo traigan.
 */
export const MINUTOS_DESFASE_HORARIO = -300;

/** Lo gastado en cada función. El tope se mide contra la suma. */
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
  /**
   * Fecha de la vieja renovación semanal. Ya no se lee para nada: se guarda
   * y se devuelve tal cual porque la columna sigue en la tabla.
   */
  readonly freeResetAt: Date;
  readonly dailyUsed: number;
  readonly dailyResetAt: Date;
  readonly lifetimeUsed: number;
}

/**
 * El contador "4/6" de una función.
 *
 * Con la bolsa común, las cuatro entradas dicen lo mismo: lo gastado ENTRE
 * TODAS. Se mantiene una entrada por función porque así lo lee la app
 * publicada, y gracias a eso el cambio llegó sin publicar versión nueva.
 */
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
 * `funciones` es lo que usa la app: cada pantalla busca su entrada y pinta
 * su contador, que desde la bolsa común es el mismo en las cuatro.
 *
 * Los cuatro campos sueltos de abajo son la vista del dispositivo entero, y
 * siguen aquí por APKs antiguos que todavía los lean.
 */
export interface SaldoVisible {
  readonly esPremium: boolean;
  readonly usadosHoy: number;
  readonly limiteDiario: number | null;
  readonly funciones: readonly SaldoFuncion[];

  /** @deprecated Lo gastado entre todas. Solo para APKs antiguos. */
  readonly gratisUsados: number;
  /** @deprecated */
  readonly gratisTotales: number;
  /** @deprecated */
  readonly gratisRestantes: number;
  /** @deprecated ¿Le queda algún intento? */
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

  /** Lo gastado entre las cuatro funciones. */
  private totalGratisUsados(): number {
    return FUNCIONES.reduce((total, f) => total + this.freeUsed(f), 0);
  }

  /**
   * Intentos gratis que le quedan, de los 6 de por vida.
   *
   * Con la bolsa común, `funcion` no cambia la cuenta, y sin renovación
   * tampoco la cambia `ahora`. Se siguen pidiendo porque es la pregunta que
   * hace quien llama ("¿puedo generar AQUÍ, AHORA?"): si algún día vuelven
   * las bolsas por función o la renovación, el cambio se queda dentro de
   * esta clase.
   */
  gratisRestantes(_funcion: Funcion, _ahora: Date): number {
    return Math.max(0, CREDITOS_GRATIS - this.totalGratisUsados());
  }

  /**
   * ¿Puede generar ahora mismo en esa función?
   *
   * - Premium: sí, mientras no supere el tope diario de uso justo.
   * - Gratis: sí, mientras le quede alguno de sus 6 intentos.
   */
  puedeGenerar(funcion: Funcion, esPremium: boolean, ahora: Date): boolean {
    if (esPremium) {
      return this.usadosHoy(ahora) < LIMITE_DIARIO_PREMIUM;
    }
    return this.gratisRestantes(funcion, ahora) > 0;
  }

  /** Lo que se le devuelve a la app para pintar los contadores. */
  aVistaUsuario(esPremium: boolean, ahora: Date): SaldoVisible {
    // Una entrada por función porque así lo lee la app, pero todas con la
    // misma cuenta: la de la bolsa común.
    const funciones = FUNCIONES.map((funcion) => {
      const restantes = this.gratisRestantes(funcion, ahora);

      return {
        funcion,
        gratisUsados: CREDITOS_GRATIS - restantes,
        gratisTotales: CREDITOS_GRATIS,
        gratisRestantes: restantes,
        puedeGenerar: this.puedeGenerar(funcion, esPremium, ahora),
      };
    });

    const restantes = this.gratisRestantes(Funcion.ANALIZAR_CHAT, ahora);

    return {
      esPremium,
      usadosHoy: this.usadosHoy(ahora),
      limiteDiario: esPremium ? LIMITE_DIARIO_PREMIUM : null,
      funciones,

      gratisUsados: CREDITOS_GRATIS - restantes,
      gratisTotales: CREDITOS_GRATIS,
      gratisRestantes: restantes,
      puedeGenerar: funciones.some((f) => f.puedeGenerar),
    };
  }

  // ── Comandos ────────────────────────────────────────────────────────────

  /**
   * Descuenta un crédito, anotado en esa función. Lanza si no corresponde.
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

    // Aquí se renovaban los gratis cada semana. Desde el 23 de noviembre de
    // 2026 no vuelven: son 6 de por vida.

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
}

/**
 * La medianoche siguiente EN EL HUSO DEL USUARIO. El contador diario se
 * reinicia ahí, o sea al terminar su día, no al terminar el día en Londres.
 *
 * Se calcula corriendo el reloj al huso, saltando a las 00:00 del día
 * siguiente y devolviéndolo a UTC, que es como se guarda todo.
 */
export function siguienteMedianoche(ahora: Date): Date {
  const desfase = MINUTOS_DESFASE_HORARIO * 60_000;

  const local = new Date(ahora.getTime() + desfase);
  local.setUTCHours(24, 0, 0, 0);

  return new Date(local.getTime() - desfase);
}

/**
 * Siete días desde hoy, a medianoche del huso del usuario.
 *
 * Era cuándo volvían los intentos gratis. Desde el 23 de noviembre de 2026
 * no vuelven, y esto solo rellena la columna `free_reset_at`, que sigue en
 * la tabla para no tener que migrar.
 */
export function siguienteRenovacion(ahora: Date): Date {
  const desfase = MINUTOS_DESFASE_HORARIO * 60_000;

  const local = new Date(ahora.getTime() + desfase);
  local.setUTCHours(24, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() + DIAS_RENOVACION_GRATIS - 1);

  return new Date(local.getTime() - desfase);
}
