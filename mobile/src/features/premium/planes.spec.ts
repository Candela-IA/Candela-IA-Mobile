/**
 * Los números del paywall.
 *
 * Es la única lógica de la app que el usuario ve como cifras, y en la que
 * un error no se nota mirando: un porcentaje inflado o un precio tachado
 * que no cuadra pasan por buenos en una captura de pantalla, y a las
 * tiendas les da igual que fuera sin querer — anunciar un descuento falso
 * es motivo de rechazo.
 */

import {
  formatearPrecio,
  PLAN_POR_DEFECTO,
  PLANES,
  porcentajeAhorro,
  precioComparado,
  preciosMostrados,
} from './planes';

const ANUAL = PLANES.find((p) => p.id === 'ANUAL')!;
const SEMANAL = PLANES.find((p) => p.id === 'SEMANAL')!;

describe('precios del paywall', () => {
  describe('precio de comparación', () => {
    it('el del plan anual es el semanal por 52 semanas', () => {
      expect(precioComparado(ANUAL)).toBe(
        Math.round(SEMANAL.precio * 52 * 100) / 100,
      );
    });

    it('el plan semanal no se compara consigo mismo', () => {
      // Sin esto la tarjeta semanal mostraría un precio tachado igual al
      // suyo, que es absurdo y confunde.
      expect(precioComparado(SEMANAL)).toBeNull();
    });
  });

  describe('porcentaje de ahorro', () => {
    it('sale del cociente entre los dos precios, no de una constante', () => {
      const esperado = Math.round(
        (1 - ANUAL.precio / (SEMANAL.precio * 52)) * 100,
      );

      expect(porcentajeAhorro(ANUAL)).toBe(esperado);
    });

    it('el anual ahorra algo frente al semanal', () => {
      const ahorro = porcentajeAhorro(ANUAL);

      expect(ahorro).not.toBeNull();
      expect(ahorro!).toBeGreaterThan(0);
      expect(ahorro!).toBeLessThan(100);
    });

    it('no anuncia ahorro en el plan que sirve de referencia', () => {
      expect(porcentajeAhorro(SEMANAL)).toBeNull();
    });

    it('devuelve null si el plan largo dejara de ser más barato', () => {
      // El día que alguien suba el precio anual por encima del equivalente
      // semanal, la insignia debe desaparecer sola en vez de anunciar un
      // descuento negativo.
      const carisimo = { ...ANUAL, precio: SEMANAL.precio * 52 + 10 };

      expect(porcentajeAhorro(carisimo)).toBeNull();
    });
  });

  describe('formato del precio', () => {
    it('siempre lleva dos decimales', () => {
      expect(formatearPrecio(39.99)).toBe('39.99');
      expect(formatearPrecio(4.5)).toBe('4.50');
      expect(formatearPrecio(12)).toBe('12.00');
    });
  });

  describe('catálogo de planes', () => {
    it('hay exactamente dos planes', () => {
      expect(PLANES).toHaveLength(2);
    });

    it('solo uno lleva la insignia de MÁS POPULAR', () => {
      expect(PLANES.filter((p) => p.destacado)).toHaveLength(1);
    });

    it('el plan preseleccionado existe y es el destacado', () => {
      const porDefecto = PLANES.find((p) => p.id === PLAN_POR_DEFECTO);

      expect(porDefecto).toBeDefined();
      expect(porDefecto!.destacado).toBe(true);
    });

    it('cada plan tiene su identificador de producto de tienda', () => {
      // Si uno se queda vacío, la compra falla en silencio: RevenueCat no
      // encuentra el producto y el usuario ve un error sin explicación.
      for (const plan of PLANES) {
        expect(plan.productoTienda).toMatch(/^candela_premium_/);
      }
    });
  });
});

/**
 * De dónde sale el precio que se pinta.
 *
 * Aquí el riesgo no es que se vea feo, es que se vea un precio que no es el
 * que se cobra: Google convierte a la moneda del país, y un paywall en
 * dólares delante de un cobro en soles va contra la política de la tienda.
 */
describe('qué precio se enseña', () => {
  const ANUAL_ID = ANUAL.productoTienda;
  const SEMANAL_ID = SEMANAL.productoTienda;

  const EN_SOLES = {
    [ANUAL_ID]: { monto: 120, texto: 'S/ 120.00', moneda: 'PEN' },
    [SEMANAL_ID]: { monto: 5, texto: 'S/ 5.00', moneda: 'PEN' },
  };

  describe('sin tienda', () => {
    it('cae a los precios de respaldo, con su US$ aparte', () => {
      const { ANUAL: anual } = preciosMostrados(null);

      expect(anual.moneda).toBe('US$');
      expect(anual.monto).toBe(formatearPrecio(ANUAL.precio));
    });

    it('el ahorro sigue saliendo de los dos precios fijos', () => {
      const { ANUAL: anual } = preciosMostrados(null);

      expect(anual.ahorro).toBe(porcentajeAhorro(ANUAL));
    });
  });

  describe('con la tienda contestando', () => {
    it('manda el texto de la tienda, y sin símbolo aparte', () => {
      const { ANUAL: anual } = preciosMostrados(EN_SOLES);

      // El símbolo va dentro del texto que da la tienda; ponerle otro
      // delante dejaría "US$ S/ 120.00".
      expect(anual.moneda).toBeNull();
      expect(anual.monto).toBe('S/ 120.00');
    });

    it('el ahorro se recalcula con los precios reales, no con los fijos', () => {
      const { ANUAL: anual } = preciosMostrados(EN_SOLES);

      // 120 contra 5 × 52 = 260 son 54%, nada que ver con el 90% de los
      // precios en dólares.
      expect(anual.ahorro).toBe(54);
      expect(anual.ahorro).not.toBe(porcentajeAhorro(ANUAL));
    });

    it('el tachado también va en la moneda del usuario', () => {
      const { ANUAL: anual } = preciosMostrados(EN_SOLES);

      expect(anual.comparado).toContain('260');
      expect(anual.comparado).not.toContain('US$');
    });

    it('el plan semanal no se compara consigo mismo', () => {
      const { SEMANAL: semanal } = preciosMostrados(EN_SOLES);

      expect(semanal.comparado).toBeNull();
      expect(semanal.ahorro).toBeNull();
    });
  });

  it('si la tienda solo contesta por un plan, se usan los dos de respaldo', () => {
    // Pasa de verdad mientras las suscripciones se crean una a una en la
    // consola. Mezclar un precio real con uno inventado daría un porcentaje
    // de ahorro que no le corresponde a nadie — y anunciar un descuento
    // falso es motivo de rechazo en las tiendas.
    const soloElAnual = { [ANUAL_ID]: EN_SOLES[ANUAL_ID] };

    const { ANUAL: anual, SEMANAL: semanal } = preciosMostrados(soloElAnual);

    expect(anual.moneda).toBe('US$');
    expect(anual.monto).toBe(formatearPrecio(ANUAL.precio));
    expect(semanal.monto).toBe(formatearPrecio(SEMANAL.precio));
  });
});
