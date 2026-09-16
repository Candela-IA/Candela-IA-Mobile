/**
 * DISPOSITIVO — raíz de agregado.
 *
 * Créditos y suscripción no viven sueltos: siempre se consultan y modifican
 * juntos, porque las reglas los cruzan ("¿es premium?" decide qué contador
 * se toca). Tenerlos bajo una sola raíz evita el error clásico de leer un
 * saldo con una suscripción desactualizada.
 *
 * Clase de dominio pura: sin NestJS, sin Prisma.
 */

import { CreditBalance, SaldoVisible } from '../../credits/domain/credit-balance';
import { Funcion, Nivel, Tono } from '../../generation/domain/catalogo';
import { TonoPremiumBloqueadoError } from '../../../shared/domain/domain-error';

export enum Plataforma {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export enum EstadoSuscripcion {
  NONE = 'NONE',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  BILLING_ISSUE = 'BILLING_ISSUE',
}

/**
 * Estados que dan acceso premium.
 *
 * TRIAL cuenta: son los "3 días gratis" del paywall, y durante esos días el
 * usuario debe tener todo desbloqueado — si no, no está probando el producto
 * que le vendiste.
 *
 * CANCELLED también cuenta mientras no venza: canceló la renovación, pero
 * pagó hasta cierta fecha y le corresponde usarlo hasta ahí.
 *
 * BILLING_ISSUE cuenta, y es el menos obvio de los tres. Google da un
 * PERÍODO DE GRACIA —14 días, configurado en la ficha de la suscripción—
 * durante el cual sigue reintentando el cobro y el usuario sigue siendo
 * suscriptor a todos los efectos. Sin esta línea, a quien se le caduca la
 * tarjeta le quitábamos premium el mismo día: convertir un problema de
 * tarjeta en una cancelación, y encima a alguien que ya venía pagando.
 *
 * No regala nada, porque la fecha manda igual: `esPremium` exige además que
 * la suscripción no haya vencido, y cuando la gracia se agota sin cobrar,
 * RevenueCat deja de extender esa fecha y el acceso se cae solo.
 */
const ESTADOS_CON_ACCESO = new Set([
  EstadoSuscripcion.ACTIVE,
  EstadoSuscripcion.TRIAL,
  EstadoSuscripcion.CANCELLED,
  EstadoSuscripcion.BILLING_ISSUE,
]);

export interface DatosSuscripcion {
  readonly estado: EstadoSuscripcion;
  readonly expiraEn: Date | null;
}

export class Dispositivo {
  constructor(
    readonly id: string,
    readonly deviceKey: string,
    readonly plataforma: Plataforma,
    readonly creditos: CreditBalance,
    private readonly suscripcion: DatosSuscripcion,
  ) {}

  /**
   * Un estado "con acceso" no basta: también tiene que no haber vencido.
   * Un webhook perdido puede dejar una suscripción en ACTIVE con fecha
   * pasada, y sin esta comprobación estaríamos regalando el servicio.
   */
  esPremium(ahora: Date): boolean {
    if (!ESTADOS_CON_ACCESO.has(this.suscripcion.estado)) return false;
    if (this.suscripcion.expiraEn === null) {
      return this.suscripcion.estado === EstadoSuscripcion.TRIAL;
    }
    return this.suscripcion.expiraEn > ahora;
  }

  /** Lanza si el tono lleva corona y el dispositivo no tiene suscripción. */
  verificarAccesoATono(tono: Tono, ahora: Date): void {
    if (tono.nivel === Nivel.PREMIUM && !this.esPremium(ahora)) {
      throw new TonoPremiumBloqueadoError(tono.etiqueta);
    }
  }

  /**
   * Descuenta un crédito de la bolsa de esa función, aplicando las reglas
   * según sea premium o no.
   *
   * La función es obligatoria porque desde el 5 de septiembre de 2026 cada
   * una tiene sus propios intentos gratis: sin ella no se sabe de dónde
   * descontar.
   */
  consumirCredito(funcion: Funcion, ahora: Date): void {
    this.creditos.consumir(funcion, this.esPremium(ahora), ahora);
  }

  /** Devuelve el crédito a su bolsa cuando la generación falló por nuestra culpa. */
  devolverCredito(funcion: Funcion, ahora: Date): void {
    this.creditos.revertir(funcion, this.esPremium(ahora));
  }

  /** Lo que la app pinta: los contadores "4/6" y si puede seguir generando. */
  saldoVisible(ahora: Date): SaldoVisible {
    return this.creditos.aVistaUsuario(this.esPremium(ahora), ahora);
  }
}
