/**
 * La decisión de reintentar es la única parte del cliente que puede costar
 * dinero si se equivoca: repetir un `POST /generar` que ya se cobró le quita
 * dos créditos al usuario por un solo mensaje.
 *
 * Estas pruebas fijan cuándo se repite y cuándo no.
 */

import { ErrorApi, sePuedeReintentar } from './cliente';

/** Lo que lanza el cliente cuando no llega al servidor. */
const SIN_CONEXION = new ErrorApi('SIN_CONEXION', 'sin red', undefined, true);

/** 502/503/504: el servidor estaba desplegándose. */
const SERVIDOR_CAIDO = new ErrorApi('DESCONOCIDO', 'bad gateway', 503, true);

/** Sin créditos: repetirlo daría el mismo resultado, y abre el paywall. */
const SIN_CREDITOS = new ErrorApi('SIN_CREDITOS', 'sin créditos', 402, false);

const RAPIDO = 400;
const LENTO = 6_000;

describe('sePuedeReintentar', () => {
  describe('errores que no se reintentan nunca', () => {
    it('los del propio usuario, como quedarse sin créditos', () => {
      expect(sePuedeReintentar(SIN_CREDITOS, 'POST', RAPIDO)).toBe(false);
      expect(sePuedeReintentar(SIN_CREDITOS, 'GET', RAPIDO)).toBe(false);
    });

    it('un tono premium sin suscripción', () => {
      const premium = new ErrorApi('TONO_PREMIUM', 'premium', 402, false);

      expect(sePuedeReintentar(premium, 'POST', RAPIDO)).toBe(false);
    });
  });

  describe('GET: siempre que el error lo permita', () => {
    it('reintenta aunque haya tardado, porque no cambia nada', () => {
      expect(sePuedeReintentar(SIN_CONEXION, 'GET', LENTO)).toBe(true);
      expect(sePuedeReintentar(SERVIDOR_CAIDO, 'GET', LENTO)).toBe(true);
    });
  });

  describe('POST: solo si el servidor no llegó a procesarlo', () => {
    it('reintenta cuando falla rápido — no dio tiempo a generar nada', () => {
      expect(sePuedeReintentar(SIN_CONEXION, 'POST', RAPIDO)).toBe(true);
      expect(sePuedeReintentar(SERVIDOR_CAIDO, 'POST', RAPIDO)).toBe(true);
    });

    it('NO reintenta cuando falla tarde: pudo haberse cobrado ya', () => {
      // Este es el caso que protege el crédito del usuario. Una generación
      // tarda entre 3 y 8 segundos; si falló a los 6, el backend pudo haber
      // cobrado antes de romperse.
      expect(sePuedeReintentar(SIN_CONEXION, 'POST', LENTO)).toBe(false);
      expect(sePuedeReintentar(SERVIDOR_CAIDO, 'POST', LENTO)).toBe(false);
    });

    it('el corte está en 2,5 segundos', () => {
      expect(sePuedeReintentar(SIN_CONEXION, 'POST', 2_499)).toBe(true);
      expect(sePuedeReintentar(SIN_CONEXION, 'POST', 2_500)).toBe(false);
    });
  });

  it('sin método, se trata como GET', () => {
    expect(sePuedeReintentar(SIN_CONEXION, undefined, LENTO)).toBe(true);
  });
});

describe('ErrorApi', () => {
  it('sabe cuáles abren el paywall', () => {
    expect(SIN_CREDITOS.requierePaywall).toBe(true);
    expect(
      new ErrorApi('TONO_PREMIUM', 'x', 402, false).requierePaywall,
    ).toBe(true);
  });

  it('un fallo de red no abre el paywall', () => {
    expect(SIN_CONEXION.requierePaywall).toBe(false);
    expect(SERVIDOR_CAIDO.requierePaywall).toBe(false);
  });
});
