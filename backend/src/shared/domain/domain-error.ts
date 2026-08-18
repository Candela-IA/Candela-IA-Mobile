/**
 * Errores de dominio.
 *
 * Son independientes de HTTP a propósito: el dominio no sabe que existe una
 * API REST. La capa de infraestructura los traduce a códigos HTTP.
 */

export abstract class DomainError extends Error {
  /** Código estable que el cliente móvil puede usar para decidir qué mostrar. */
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** El usuario agotó sus 5 intentos gratis y no tiene suscripción activa. */
export class SinCreditosError extends DomainError {
  readonly code = 'SIN_CREDITOS';

  constructor() {
    super('Se agotaron tus intentos gratis. Suscríbete para continuar.');
  }
}

/** Suscriptor que superó el tope diario de uso justo. */
export class LimiteDiarioAlcanzadoError extends DomainError {
  readonly code = 'LIMITE_DIARIO';

  constructor(limite: number) {
    super(`Alcanzaste el límite de ${limite} generaciones por hoy.`);
  }
}

/** Intentó usar un tono con corona sin tener suscripción. */
export class TonoPremiumBloqueadoError extends DomainError {
  readonly code = 'TONO_PREMIUM';

  constructor(tono: string) {
    super(`El modo "${tono}" es exclusivo de Candela IA Premium.`);
  }
}

/** El tono pedido no pertenece a esa función. */
export class TonoInvalidoError extends DomainError {
  readonly code = 'TONO_INVALIDO';

  constructor(tono: string, funcion: string) {
    super(`El modo "${tono}" no está disponible en ${funcion}.`);
  }
}

/** Analizar chat y Analizar stories requieren imagen; las otras dos no. */
export class ImagenRequeridaError extends DomainError {
  readonly code = 'IMAGEN_REQUERIDA';

  constructor(funcion: string) {
    super(`${funcion} necesita una captura para funcionar.`);
  }
}

export class ImagenNoEsperadaError extends DomainError {
  readonly code = 'IMAGEN_NO_ESPERADA';

  constructor(funcion: string) {
    super(`${funcion} no recibe capturas.`);
  }
}

/** El dispositivo no está registrado. */
export class DispositivoNoEncontradoError extends DomainError {
  readonly code = 'DISPOSITIVO_NO_ENCONTRADO';

  constructor() {
    super('Dispositivo no registrado.');
  }
}
